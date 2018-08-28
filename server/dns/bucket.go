package dns

import (
	"sync"
)

// Bucket stores the A Records and PTR Records
type Bucket struct {
	mtx             *sync.RWMutex
	addrToHostnames map[string][]string
	hostnameToAddr  map[string]string
}

// NewBucket returns a new empty bucket
func NewBucket() *Bucket {
	return &Bucket{
		mtx:             &sync.RWMutex{},
		addrToHostnames: make(map[string][]string, 0),
		hostnameToAddr:  make(map[string]string, 0),
	}
}

// GetHostnamesFromAddress returns any hostnames associated with an addresses
func (b *Bucket) GetHostnamesFromAddress(ipAddress string) []string {
	b.mtx.RLock()
	val, exists := b.addrToHostnames[ipAddress]
	b.mtx.RUnlock()
	if exists {
		return val
	}
	return []string{}
}

// GetFirstHostnameForAddresses returns the first valid hostname for a slice of addresses
func (b *Bucket) GetFirstHostnameForAddresses(addresses []string) []string {
	results := make([]string, len(addresses))
	b.mtx.RLock()
	for i := 0; i < len(addresses); i++ {
		val, exists := b.addrToHostnames[addresses[i]]
		if exists {
			results[i] = val[0]
		} else {
			results[i] = ""
		}
	}
	b.mtx.RUnlock()
	return results
}

// GetAddressesFromHostname returns any addresses from a hostname
func (b *Bucket) GetAddressesFromHostname(hostname string) string {
	b.mtx.RLock()
	defer b.mtx.RUnlock()
	return b.hostnameToAddr[hostname]
}

// Reset zeroizes the bucket
func (b *Bucket) Reset() {
	b.mtx.Lock()
	b.addrToHostnames = map[string][]string{}
	b.hostnameToAddr = map[string]string{}
	b.mtx.Unlock()
}

// Swap all existing data with the new data in provided bucket
func (b *Bucket) Swap(newBucket *Bucket) {
	newBucket.mtx = b.mtx
	b.mtx.Lock()
	b.addrToHostnames = newBucket.addrToHostnames
	b.hostnameToAddr = newBucket.hostnameToAddr
	b.mtx.Unlock()
}

func appendToSliceIfMissing(slc []string, s1 string) []string {
	for _, s2 := range slc {
		if s2 == s1 {
			return slc
		}
	}
	return append(slc, s1)
}
