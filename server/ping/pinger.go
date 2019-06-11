package ping

import (
	"log"
	"math"
	"net"
	"strconv"
	"sync"
	"time"

	"github.com/demskie/randutil"

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
	lastLatency     int
	lastUpdateTime  time.Time
	isInRequestChan bool
}

// ScanNetwork will inform the backgroundScanner to look at these IPs next
func (p *Pinger) ScanNetwork(network *net.IPNet) {
	log.Printf("scanning => %v\n", network.String())
	i := 0
	currentIP := subnetmath.DuplicateAddr(network.IP)
	for network.Contains(currentIP) {
		p.mtx.Lock()
		lastResult, exists := p.data[currentIP.String()]
		if exists && !lastResult.isInRequestChan &&
			time.Since(lastResult.lastUpdateTime) > 3*time.Minute+10*time.Second {
			lastResult.isInRequestChan = true
			p.data[currentIP.String()] = lastResult
			p.requestChan <- currentIP.String()
		}
		p.mtx.Unlock()
		currentIP = subnetmath.NextAddr(currentIP)
		if i > 1e5 {
			break
		}
		i++
	}
}

// ScanPretendNetwork is used faking a scan for testing and demonstration purposes
func (p *Pinger) ScanPretendNetwork(network *net.IPNet) {
	// log.Printf("scanning => %v\n", network.String())
	i := 0
	currentIP := subnetmath.DuplicateAddr(network.IP)
	rnum := randutil.CreateUniqueMathRnum()
	for network.Contains(currentIP) {
		reachable := rnum.Float64() < 0.75
		time.Sleep(25 * time.Millisecond)
		p.mtx.Lock()
		pingData := p.data[currentIP.String()]
		if time.Since(pingData.lastUpdateTime) > 2*time.Minute {
			if reachable {
				pingData.lastLatency = int(30 + rnum.NormFloat64()*200)
			} else {
				pingData.lastLatency = math.MinInt32
			}
			pingData.lastUpdateTime = time.Now()
			pingData.isInRequestChan = false
			p.data[currentIP.String()] = pingData
		}
		p.mtx.Unlock()
		currentIP = subnetmath.NextAddr(currentIP)
		if i > 1e5 {
			break
		}
		i++
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
			p.mtx.RLock()
			pingData, exists := p.data[ipString]
			p.mtx.RUnlock()
			if !exists || time.Since(pingData.lastUpdateTime) > 2*time.Minute {
				start := time.Now()
				reachable, _ := ping(ipString) // TODO: provide ternary results
				if reachable {
					pingData.lastLatency = 1 + int(time.Since(start)/time.Millisecond)
				} else {
					pingData.lastLatency = math.MinInt32
				}
				pingData.lastUpdateTime = time.Now()
			}
			pingData.isInRequestChan = false
			p.mtx.Lock()
			p.data[ipString] = pingData
			p.mtx.Unlock()
			<-time.NewTimer(interval).C
		}
	})
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
			results[i] = val.lastUpdateTime.Format(defaultTimeLayout)
		} else {
			results[i] = ""
		}
	}
	p.mtx.RUnlock()
	return results
}

// ScanResult is used by the client side to display reachability info
type ScanResult struct {
	Address         string `json:"address"`
	Latency         int    `json:"latency"`
	Hostname        string `json:"hostname"`
	TimeSinceUpdate int    `json:"timeSinceUpdate"`
}

// GetScanResults returns a string slice of host addresses and their reachability status
func (p *Pinger) GetScanResults(network *net.IPNet) (results []ScanResult) {
	p.mtx.RLock()
	currentIP := subnetmath.DuplicateAddr(network.IP)
	i := 0
	for network.Contains(currentIP) {
		ipString := currentIP.String()
		val, exists := p.data[ipString]
		if exists {
			results = append(results, ScanResult{
				Address:         ipString,
				Latency:         val.lastLatency,
				Hostname:        "", // TODO: implement!
				TimeSinceUpdate: int(time.Since(val.lastUpdateTime) / time.Millisecond),
			})
		} else {
			results = append(results, ScanResult{
				Address:         ipString,
				Latency:         math.MinInt32,
				Hostname:        "",
				TimeSinceUpdate: math.MaxInt32,
			})
		}
		currentIP = subnetmath.NextAddr(currentIP)
		if i > 1e5 {
			break
		}
		i++
	}
	p.mtx.RUnlock()
	return results
}
