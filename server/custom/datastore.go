package custom

import (
	"strings"
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
	unmatchedData [][]string
}

// NewDatastore creates a new datastore object
func NewDatastore() *Datastore {
	return &Datastore{
		mtx:           &sync.RWMutex{},
		customHeaders: make([]header, 0),
		customData:    make([]map[address]value, 0),
		unmatchedData: make([][]string, 0),
	}
}

func deepCopyNestedStrings(old [][]string) (new [][]string) {
	new = make([][]string, 0, len(old))
	for _, slc := range old {
		new = append(new, slc[:])
	}
	return new
}

// SwapDatastore replaces everything with supplied data
func (d *Datastore) SwapDatastore(data []map[string]string, unmatched [][]string, headers []string) {
	newCustomData := make([]map[address]value, len(headers))
	newCustomHeaders := make([]header, len(headers))
	for i := range headers {
		newCustomHeaders[i] = header(headers[i])
		newCustomData[i] = map[address]value{}
		for k, v := range data[i] {
			newCustomData[i][address(k)] = value(v)
		}
	}
	d.mtx.Lock()
	d.customData = newCustomData
	d.unmatchedData = deepCopyNestedStrings(unmatched)
	d.customHeaders = newCustomHeaders
	d.mtx.Unlock()
}

// AppendCustomData returns a new string slice for sending to client
func (d *Datastore) AppendCustomData(existingData [][]string) [][]string {
	newData := make([][]string, len(existingData))
	for i := range newData {
		newData[i] = existingData[i]
	}
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

// SearchAllCustomData will return any hosts and unmatched lines of hostData that include the query string
func (d *Datastore) SearchAllCustomData(query string, stopChan chan struct{}) (matchedHosts []string, unmatchedLines [][]string) {
	d.mtx.RLock()
	matchedHostsMap := map[address]struct{}{}
	for i := range d.customData {
		for addr, val := range d.customData[i] {
			if strings.Contains(strings.ToLower(string(val)), query) {
				matchedHostsMap[addr] = struct{}{}
			}
		}
	}
	for addr := range matchedHostsMap {
		matchedHosts = append(matchedHosts, string(addr))
	}
	unmatchedLines = make([][]string, 0, len(d.customHeaders))
	for _, slc := range d.unmatchedData {
		for _, s := range slc {
			if strings.Contains(strings.ToLower(s), query) {
				newSlc := append([]string{"unknown", "-", "-", "-"}, slc...)
				unmatchedLines = append(unmatchedLines, newSlc)
				break
			}
		}
	}
	d.mtx.RUnlock()
	return matchedHosts, unmatchedLines
}
