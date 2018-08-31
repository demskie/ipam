package server

import (
	"strconv"
	"strings"

	"github.com/demskie/ipam/server/ping"
	"github.com/demskie/ipam/server/subnets"
	"github.com/demskie/subnetmath"
)

func (ipam *IPAMServer) searchSubnetData(query string, stopChan chan struct{}) []subnets.SubnetJSON {
	results := []subnets.SubnetJSON{}
	allSubnets := ipam.subnets.GetAllSubnets()
	for _, sn := range allSubnets {
		if strings.Contains(strings.ToLower(sn.Net), query) ||
			strings.Contains(strings.ToLower(sn.Desc), query) ||
			strings.Contains(strings.ToLower(sn.Details), query) ||
			strings.Contains(strings.ToLower(sn.Vlan), query) {
			results = append(results, subnets.SubnetJSON{
				ID:      strconv.Itoa(len(results)),
				Net:     sn.Net,
				Desc:    sn.Desc,
				Notes:   sn.Details,
				Vlan:    sn.Vlan,
				ModTime: sn.Mod,
			})
		}
	}
	return results
}

func (ipam *IPAMServer) searchHostData(query string, stopChan chan struct{}) [][]string {
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
	matchedAddrs, unmatchedLines := ipam.custom.SearchAllCustomData(query, stopChan)
	matchedAddrs = ipam.dns.SearchAllHostnames(query, matchedAddrs)
	sliceOfAddresses := make([]string, 0, len(matchedAddrs))
	for addr := range matchedAddrs {
		sliceOfAddresses = append(sliceOfAddresses, addr)
	}
	hostData := [][]string{
		sliceOfAddresses,
		ipam.dns.GetFirstHostnameForAddresses(sliceOfAddresses),
		ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses),
		ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses),
	}
	hostData = ipam.custom.AppendCustomData(hostData)
	return append(unmatchedLines, hostData...)
}
