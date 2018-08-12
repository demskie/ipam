package ping

import (
	"log"
	"net"
	"sync"
	"time"

	"github.com/demskie/simplesync"
	"github.com/demskie/subnetmath"
)

const defaultTimeLayout = "01-02-2006 15:04:05"

// Pinger will scan a network using ICMP and remember the results
type Pinger struct {
	mtx            *sync.RWMutex
	slowScanSemphr chan struct{}
	data           map[string]result
	requestChan    chan string
}

// NewPinger returns a new Pinger object
func NewPinger() (ping *Pinger) {
	ping = &Pinger{
		mtx:         &sync.RWMutex{},
		data:        make(map[string]result, 0),
		requestChan: make(chan string, 0),
	}
	go ping.startBackgroundScanner()
	return
}

type result struct {
	lastValue   string
	attemptTime string
}

// used with result.lastValue
const (
	SUCCESS = "success"
	FAILURE = "failure"
)

// ScanNetwork will inform the backgroundScanner to look at these IPs next
func (p *Pinger) ScanNetwork(network *net.IPNet) {
	log.Printf("scanning => %v\n", network.String())
	currentIP := subnetmath.DuplicateAddr(network.IP)
	for i := 0; i < GetNumberOfHosts(network); i++ {
		p.requestChan <- currentIP.String()
		currentIP = subnetmath.AddToAddr(currentIP, 1)
	}
}

func ping(ip string) bool {
	addr := net.ParseIP(ip)
	if addr != nil {
		for i := 0; i < 2; i++ {
			var err error
			if addr.To4() != nil {
				err = pingICMPv4(addr, 2)
			} else {
				err = pingICMPv6(addr, 2)
			}
			if err == nil {
				return true
			}
		}
	}
	return false
}

const (
	maxPingsPerSecond  = 32
	pingGoroutineCount = 64
	fastInterval       = time.Duration(pingGoroutineCount * (int64(time.Second) / maxPingsPerSecond))
)

func (p *Pinger) startBackgroundScanner() {
	workers := simplesync.NewWorkerPool(pingGoroutineCount)
	workers.Execute(func(threadNum int) {
		for ipString := range p.requestChan {
			reachable := ping(ipString)
			p.mtx.Lock()
			pingData := p.data[ipString]
			pingData.attemptTime = time.Now().Format(defaultTimeLayout)
			if reachable {
				pingData.lastValue = SUCCESS
			} else {
				pingData.lastValue = FAILURE
			}
			p.data[ipString] = pingData
			p.mtx.Unlock()
			<-time.NewTimer(fastInterval).C
		}
	})
}

// GetNumberOfHosts limits the number of hosts to display information for
func GetNumberOfHosts(network *net.IPNet) int {
	numberAddrs := subnetmath.AddressCount(network)
	switch {
	case numberAddrs > 1024:
		return 1023
	case numberAddrs > 2:
		return numberAddrs - 1
	}
	return numberAddrs
}

// GetHostResult returns a the result and formatted time of the latest ping attempt
func (p *Pinger) GetHostResult(hostAddr string) (string, string) {
	p.mtx.RLock()
	data := p.data[hostAddr]
	p.mtx.RUnlock()
	return data.lastValue, data.attemptTime
}
