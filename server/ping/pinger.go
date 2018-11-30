package ping

import (
	"log"
	"math"
	"net"
	"strconv"
	"sync"
	"time"

	"github.com/demskie/simplesync"
	"github.com/demskie/subnetmath"
)

const (
	defaultTimeLayout = "01-02-2006 15:04:05"
	maximumHostCount  = 2048
)

// Pinger will scan a network using ICMP and remember the results
type Pinger struct {
	mtx         *sync.RWMutex
	data        map[string]result
	requestChan chan string
}

// NewPinger returns a new Pinger object
func NewPinger() (ping *Pinger) {
	ping = &Pinger{
		mtx:         &sync.RWMutex{},
		data:        make(map[string]result, 0),
		requestChan: make(chan string, 0),
	}
	return
}

type result struct {
	lastLatency    int
	pendingUpdate  bool
	lastUpdateTime string
}

// ScanNetwork will inform the backgroundScanner to look at these IPs next
func (p *Pinger) ScanNetwork(network *net.IPNet) {
	log.Printf("scanning => %v\n", network.String())
	currentIP := subnetmath.DuplicateAddr(network.IP)
	for i := 0; i < GetNumberOfHosts(network); i++ {
		p.requestChan <- currentIP.String()
		currentIP = subnetmath.AddToAddr(currentIP, 1)
	}
}

func ping(ip string) (reachable bool, foundError bool) {
	addr := net.ParseIP(ip)
	if addr != nil {
		for i := 0; i < 2; i++ {
			var err error
			if addr.To4() != nil {
				reachable, err = pingICMPv4(addr, 3)
			} else {
				reachable, err = pingICMPv6(addr, 3)
			}
			foundError = false
			if err != nil {
				foundError = true
			}
			return reachable, foundError
		}
	}
	return false, true
}

// InitializeBackgroundPinger will create the workers needed for scanning
func (p *Pinger) InitializeBackgroundPinger(maxPingsPerSecond, goroutineCount int) {
	interval := time.Duration(int64(goroutineCount) * (int64(time.Second) / int64(maxPingsPerSecond)))
	workers := simplesync.NewWorkerPool(goroutineCount)
	workers.Execute(func(threadNum int) {
		for ipString := range p.requestChan {
			start := time.Now()
			reachable, _ := ping(ipString) // TODO: provide ternary results
			p.mtx.Lock()
			pingData := p.data[ipString]
			if reachable {
				pingData.lastLatency = 1 + int(time.Since(start)/time.Millisecond)
			} else {
				pingData.lastLatency = math.MinInt32
			}
			pingData.pendingUpdate = false
			pingData.lastUpdateTime = time.Now().Format(defaultTimeLayout)
			p.data[ipString] = pingData
			p.mtx.Unlock()
			<-time.NewTimer(interval).C
		}
	})
}

// GetNumberOfHosts limits the number of hosts to display information for
func GetNumberOfHosts(network *net.IPNet) int {
	addressCount := subnetmath.AddressCountInt(network)
	if addressCount >= maximumHostCount {
		addressCount = maximumHostCount - 1
	} else if addressCount > 2 {
		addressCount--
	} else if addressCount < 1 {
		addressCount++
	}
	return addressCount
}

// GetPingResultsForAddresses returns ping results for slice of addresses
func (p *Pinger) GetPingResultsForAddresses(addresses []string) []string {
	results := make([]string, len(addresses))
	p.mtx.RLock()
	for i := 0; i < len(addresses); i++ {
		val, exists := p.data[addresses[i]]
		if exists {
			results[i] = strconv.Itoa(val.lastLatency) + "ms"
		} else {
			results[i] = ""
		}
	}
	p.mtx.RUnlock()
	return results
}

// GetPingTimesForAddresses returns last ping attemptTime for slice of addresses
func (p *Pinger) GetPingTimesForAddresses(addresses []string) []string {
	results := make([]string, len(addresses))
	p.mtx.RLock()
	for i := 0; i < len(addresses); i++ {
		val, exists := p.data[addresses[i]]
		if exists {
			results[i] = val.lastUpdateTime
		} else {
			results[i] = ""
		}
	}
	p.mtx.RUnlock()
	return results
}

// MarkHostsAsPending will sweep through all hosts in a subnet and mark them as pending update
func (p *Pinger) MarkHostsAsPending(network *net.IPNet) {
	var (
		addressCount = subnetmath.AddressCountInt(network)
		currentIP    = subnetmath.DuplicateAddr(network.IP)
		ipString     = currentIP.String()
	)
	p.mtx.Lock()
	for i := 0; i < addressCount; i++ {
		val, exists := p.data[ipString]
		if exists {
			val.pendingUpdate = true
			p.data[ipString] = val
		} else {
			p.data[ipString] = result{
				pendingUpdate: true,
			}
		}
		currentIP = subnetmath.AddToAddr(currentIP, 1)
		ipString = currentIP.String()
	}
	p.mtx.Unlock()
}

// GetScanResults returns a string slice of host addresses and their reachability status
func (p *Pinger) GetScanResults(network *net.IPNet) [][]string {
	var (
		results   = make([][]string, GetNumberOfHosts(network))
		currentIP = subnetmath.DuplicateAddr(network.IP)
		ipString  = currentIP.String()
	)
	p.mtx.RLock()
	for i := 0; i < len(results); i++ {
		val, exists := p.data[ipString]
		if exists {
			results[i] = []string{
				ipString,
				strconv.FormatInt(int64(val.lastLatency), 10),
				strconv.FormatBool(val.pendingUpdate),
			}
		} else {
			p.data[ipString] = result{}
		}
		currentIP = subnetmath.AddToAddr(currentIP, 1)
		ipString = currentIP.String()
	}
	p.mtx.RUnlock()
	return results
}
