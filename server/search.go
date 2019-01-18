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

func (ipam *IPAMServer) searchHostData(query string, stopChan chan struct{}) [][]string {
	network := subnetmath.ParseNetworkCIDR(query)
	if network != nil {
		sliceOfAddresses := []string{}
		currentIP := subnetmath.DuplicateAddr(network.IP)
		for network.Contains(currentIP) {
			sliceOfAddresses = append(sliceOfAddresses, currentIP.String())
			currentIP = subnetmath.NextAddr(currentIP)
		}
		hostData := [][]string{
			sliceOfAddresses,
			ipam.dns.GetFirstHostnameForAddresses(sliceOfAddresses),
			ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses),
			ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses),
		}
		return ipam.custom.AppendCustomData(hostData)
	}
	matchedAddrs, unmatchedLines, headers := ipam.custom.SearchAllCustomData(query, stopChan)
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
	if len(unmatchedLines) > 0 && len(hostData) == 4 {
		hostData = append(hostData, make([][]string, len(headers))...)
		for i := 4; i < len(headers); i++ {
			hostData[i] = []string{}
		}
	}
	for _, line := range unmatchedLines {
		hostData[0] = append(hostData[0], "???")
		hostData[1] = append(hostData[1], "")
		hostData[2] = append(hostData[2], "")
		hostData[3] = append(hostData[3], "")
		for i := range line {
			hostData[4+i] = append(hostData[4+i], line[i])
		}
	}
	return hostData
}
