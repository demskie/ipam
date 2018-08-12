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
	defer b.mtx.RUnlock()
	return b.forwardRecords[ipAddress]
}

// GetReverseRecord returns the PTR record of a hostname if there is one
func (b *Bucket) GetReverseRecord(hostname string) string {
	b.mtx.RLock()
	defer b.mtx.RUnlock()
	return b.reverseRecords[hostname]
}

// Reset zeroizes the bucket
func (b *Bucket) Reset() {
	b.mtx.Lock()
	b.forwardRecords = map[string][]string{}
	b.reverseRecords = map[string]string{}
	b.mtx.Unlock()
}
