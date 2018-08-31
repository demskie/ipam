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
	mtx          *sync.RWMutex
	headers      []header
	structured   map[address][]value
	unstructured [][]value
}

// NewDatastore creates a new datastore object
func NewDatastore() *Datastore {
	return &Datastore{
		mtx:          &sync.RWMutex{},
		headers:      make([]header, 0),
		structured:   make(map[address][]value, 0),
		unstructured: make([][]value, 0),
	}
}

// DeviceData represents a single element of data for a device with an address
type DeviceData struct {
	Header  string
	Address string
	Value   string
}

// UnknownDeviceData is used when the address is not known
type UnknownDeviceData struct {
	Header string
	ID     int
	Value  string
}

func createHeaderMap(devicesWithAddr []DeviceData, devicesWithoutAddr []UnknownDeviceData, headerOrder []string) map[string]int {
	headerMap := map[string]int{}
	for _, hdr := range headerOrder {
		_, exists := headerMap[hdr]
		if !exists {
			headerMap[hdr] = len(headerMap)
		}
	}
	for _, dd := range devicesWithAddr {
		_, exists := headerMap[dd.Header]
		if !exists {
			headerMap[dd.Header] = len(headerMap)
		}
	}
	for _, udd := range devicesWithoutAddr {
		_, exists := headerMap[udd.Header]
		if !exists {
			headerMap[udd.Header] = len(headerMap)
		}
	}
	return headerMap
}

func createStructuredData(devicesWithAddr []DeviceData, headerMap map[string]int) map[address][]value {
	structuredData := map[address][]value{}
	for _, dd := range devicesWithAddr {
		_, exists := structuredData[address(dd.Address)]
		if !exists {
			structuredData[address(dd.Address)] = make([]value, len(headerMap))
		}
		structuredData[address(dd.Address)][headerMap[dd.Header]] = value(dd.Value)
	}
	return structuredData
}

func createUnstructuredData(devicesWithoutAddr []UnknownDeviceData, headerMap map[string]int) [][]value {
	uniqueDevices := map[int][]value{}
	for _, udd := range devicesWithoutAddr {
		_, exists := uniqueDevices[udd.ID]
		if !exists {
			uniqueDevices[udd.ID] = make([]value, len(headerMap))
		}
		uniqueDevices[udd.ID][headerMap[udd.Header]] = value(udd.Value)
	}
	unstructuredData := make([][]value, 0, len(uniqueDevices))
	for _, values := range uniqueDevices {
		unstructuredData = append(unstructuredData, values)
	}
	return unstructuredData
}

// RecreateDatastore replaces everything with supplied data
func (d *Datastore) RecreateDatastore(devicesWithAddr []DeviceData, devicesWithoutAddr []UnknownDeviceData, preferredHeaderOrder []string) {
	headerMap := createHeaderMap(devicesWithAddr, devicesWithoutAddr, preferredHeaderOrder)
	headers := make([]header, len(headerMap))
	for hdr, i := range headerMap {
		headers[i] = header(hdr)
	}
	structured := createStructuredData(devicesWithAddr, headerMap)
	unstructured := createUnstructuredData(devicesWithoutAddr, headerMap)
	d.mtx.Lock()
	d.headers = headers
	d.structured = structured
	d.unstructured = unstructured
	d.mtx.Unlock()
}

// AppendCustomData returns a new string slice for sending to client
func (d *Datastore) AppendCustomData(existingData [][]string) [][]string {
	d.mtx.RLock()
	if len(d.structured) > 0 {
		sliceOfAddresses := existingData[0]
		for i, hdr := range d.headers {
			newSlice := make([]string, 0, len(sliceOfAddresses)+1)
			newSlice = append(newSlice, string(hdr))
			for _, addr := range sliceOfAddresses {
				val, exists := d.structured[address(addr)]
				if exists {
					newSlice = append(newSlice, string(val[i]))
				} else {
					newSlice = append(newSlice, "")
				}
			}
			existingData = append(existingData, newSlice)
		}
	}
	d.mtx.RUnlock()
	return existingData
}

const searchLimit = 100000

// SearchAllCustomData will return any hosts and unknownHosts of hostData that include the query string
func (d *Datastore) SearchAllCustomData(query string, stopChan chan struct{}) (matchedAddrs map[string]struct{}, matchedUnknownDevices [][]string, copiedHeaders []string) {
	d.mtx.RLock()
	matchedAddrs = map[string]struct{}{}
	for addr, device := range d.structured {
		if len(matchedAddrs) > searchLimit {
			break
		}
		for _, val := range device {
			if strings.Contains(strings.ToLower(string(val)), query) {
				matchedAddrs[string(addr)] = struct{}{}
				break
			}
		}
	}
	matchedUnknownDevices = [][]string{}
	for _, device := range d.unstructured {
		if len(matchedUnknownDevices) > searchLimit {
			break
		}
		for _, val := range device {
			if strings.Contains(strings.ToLower(string(val)), query) {
				newSlice := make([]string, len(d.headers))
				for i := range device {
					newSlice[i] = string(device[i])
				}
				matchedUnknownDevices = append(matchedUnknownDevices, newSlice)
				break
			}
		}
	}
	copiedHeaders = make([]string, len(d.headers))
	for i := range d.headers {
		copiedHeaders[i] = string(d.headers[i])
	}
	d.mtx.RUnlock()
	return matchedAddrs, matchedUnknownDevices, copiedHeaders
}
