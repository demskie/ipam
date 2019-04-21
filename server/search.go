package server

import (
	"strconv"
	"strings"

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
				ID:         strconv.Itoa(len(results)),
				Net:        sn.Net,
				Desc:       sn.Desc,
				Notes:      sn.Details,
				Vlan:       sn.Vlan,
				ModTime:    sn.Mod,
				ChildNodes: []subnets.SubnetJSON{},
			})
		}
	}
	return results
}

func (ipam *IPAMServer) searchHostData(query string, stopChan chan struct{}) HostData {
	network := subnetmath.ParseNetworkCIDR(query)
	if network != nil {
		sliceOfAddresses := []string{}
		currentIP := subnetmath.DuplicateAddr(network.IP)
		for network.Contains(currentIP) {
			sliceOfAddresses = append(sliceOfAddresses, currentIP.String())
			currentIP = subnetmath.NextAddr(currentIP)
		}
		hostData := HostData{
			Addresses:    sliceOfAddresses,
			Arecords:     ipam.dns.GetFirstHostnameForAddresses(sliceOfAddresses),
			LastAttempts: ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses),
			PingResults:  ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses),
			CustomData:   ipam.custom.GetCustomData(sliceOfAddresses),
		}
		return hostData
	}
	matchedAddrs, _, _ := ipam.custom.SearchAllCustomData(query, stopChan)
	matchedAddrs = ipam.dns.SearchAllHostnames(query, matchedAddrs)
	sliceOfAddresses := make([]string, 0, len(matchedAddrs))
	for addr := range matchedAddrs {
		sliceOfAddresses = append(sliceOfAddresses, addr)
	}
	hostData := HostData{
		Addresses:    sliceOfAddresses,
		Arecords:     ipam.dns.GetFirstHostnameForAddresses(sliceOfAddresses),
		LastAttempts: ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses),
		PingResults:  ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses),
		CustomData:   ipam.custom.GetCustomData(sliceOfAddresses),
	}
	return hostData
}
