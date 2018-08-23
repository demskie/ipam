package dns

import (
	"sync"
)

// Bucket stores the A Records and PTR Records
type Bucket struct {
	mtx            *sync.RWMutex
	forwardRecords map[string][]string
	reverseRecords map[string]string
}

// NewBucket returns a new empty bucket
func NewBucket() *Bucket {
	return &Bucket{
		mtx:            &sync.RWMutex{},
		forwardRecords: make(map[string][]string, 0),
		reverseRecords: make(map[string]string, 0),
	}
}

// GetForwardRecords will get a slice of A Records for the ipAddress if there are any
func (b *Bucket) GetForwardRecords(ipAddress string) []string {
	b.mtx.RLock()
	val, exists := b.forwardRecords[ipAddress]
	b.mtx.RUnlock()
	if exists {
		return val
	}
	return []string{}
}

// GetReverseRecord returns the PTR record of a hostname if there is one
func (b *Bucket) GetReverseRecord(hostname string) string {
	b.mtx.RLock()
	defer b.mtx.RUnlock()
	return b.reverseRecords[hostname]
}

// GetForwardRecordsForAddresses returns A Records for slice of addresses
func (b *Bucket) GetForwardRecordsForAddresses(addresses []string) []string {
	results := make([]string, len(addresses))
	b.mtx.RLock()
	for i := 0; i < len(addresses); i++ {
		val, exists := b.forwardRecords[addresses[i]]
		if exists {
			results[i] = val[0]
		} else {
			results[i] = ""
		}
	}
	b.mtx.RUnlock()
	return results
}

// Reset zeroizes the bucket
func (b *Bucket) Reset() {
	b.mtx.Lock()
	b.forwardRecords = map[string][]string{}
	b.reverseRecords = map[string]string{}
	b.mtx.Unlock()
}

// Swap all existing data with the new data in provided bucket
func (b *Bucket) Swap(newBucket *Bucket) {
	b.mtx.Lock()
	b.forwardRecords = newBucket.forwardRecords
	b.reverseRecords = newBucket.reverseRecords
	b.mtx.Unlock()
}
