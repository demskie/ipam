package custom

import (
	"sync"
)

type header string
type address string
type value string

// Datastore object is used to send custom data to client
type Datastore struct {
	mtx           *sync.RWMutex
	customHeaders []header
	customData    []map[address]value
}

// NewDatastore creates a new datastore object
func NewDatastore() *Datastore {
	return &Datastore{
		mtx:           &sync.RWMutex{},
		customHeaders: make([]header, 0),
		customData:    make([]map[address]value, 0),
	}
}

// SwapDatastore replaces everything with supplied data
func (d *Datastore) SwapDatastore(headers []string, data []map[string]string) {
	newCustomHeaders := make([]header, len(headers))
	newCustomData := make([]map[address]value, len(headers))
	for i := range headers {
		newCustomHeaders[i] = header(headers[i])
		newCustomData[i] = map[address]value{}
		for k, v := range data[i] {
			newCustomData[i][address(k)] = value(v)
		}
	}
	d.mtx.Lock()
	d.customHeaders = newCustomHeaders
	d.customData = newCustomData
	d.mtx.Unlock()
}

// AppendCustomData returns a new string slice for sending to client
func (d *Datastore) AppendCustomData(existingData [][]string) [][]string {
	newData := make([][]string, len(existingData))
	sliceOfAddresses := existingData[0]
	d.mtx.RLock()
	for i, hdr := range d.customHeaders {
		newSlice := make([]string, 0, len(sliceOfAddresses)+1)
		newSlice = append(newSlice, string(hdr))
		for _, addr := range sliceOfAddresses {
			newSlice = append(newSlice, string(d.customData[i][address(addr)]))
		}
		newData = append(newData, newSlice)
	}
	d.mtx.RUnlock()
	return newData
}
