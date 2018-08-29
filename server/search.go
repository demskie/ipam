package server

import (
	"strings"

	"github.com/davecgh/go-spew/spew"
	"github.com/demskie/ipam/server/ping"
	"github.com/demskie/subnetmath"
)

func (ipam *IPAMServer) searchHostData(query string, stopChan chan struct{}) [][]string {
	query = strings.TrimSpace(query)
	network := subnetmath.BlindlyParseCIDR(query)
	if network != nil {
		addressCount := ping.GetNumberOfHosts(network)
		currentIP := subnetmath.DuplicateNetwork(network).IP
		sliceOfAddresses := make([]string, addressCount)
		for i := 0; i < addressCount; i++ {
			sliceOfAddresses[i] = currentIP.String()
			currentIP = subnetmath.AddToAddr(currentIP, 1)
		}
		hostData := [][]string{
			sliceOfAddresses,
			ipam.dns.GetFirstHostnameForAddresses(sliceOfAddresses),
			ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses),
			ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses),
		}
		return ipam.custom.AppendCustomData(hostData)
	}
	query = strings.ToLower(query)
	matchedHosts, unmatchedLines := ipam.custom.SearchAllCustomData(query, stopChan)
	spew.Dump(matchedHosts, unmatchedLines) // TODO: finish func
	return nil
}
