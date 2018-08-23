package server

import (
	"encoding/csv"
	"fmt"
	"log"
	"net"
	"os"
	"strings"

	"github.com/demskie/ipam/server/dns"
	"github.com/demskie/ipam/server/subnets"
)

// IngestSubnetCSVLines will overwrite all existing subnetTree data with the csvlines being passed in
func (ipam *IPAMServer) IngestSubnetCSVLines(csvlines []string) error {
	newTree := subnets.NewTree()
	subnetColumns := make([][]string, 0, len(csvlines))
	for lineNum, line := range csvlines {
		if lineNum == 0 && strings.Contains(line, "SUBNET,") {
			log.Println("skipping line 0 as it appears to be the spreadsheet header")
			continue
		}
		val, err := csv.NewReader(strings.NewReader(line)).Read()
		if len(val) > 3 && err == nil {
			subnetColumns = append(subnetColumns, val)
		}
	}
	for lineNum, columns := range subnetColumns {
		if len(columns) < 5 {
			return fmt.Errorf("line %v is not formatted correctly", lineNum+1)
		}
		ip, subzero, err := net.ParseCIDR(columns[0])
		if err != nil {
			return fmt.Errorf("error parsing line %v > %v", lineNum+1, err)
		} else if subzero.IP.Equal(ip) == false {
			return fmt.Errorf("error parsing line %v contains %v which is not a valid network address", lineNum+1, ip)
		}
		skeleton := &subnets.SubnetSkeleton{
			Net:     subzero.String(),
			Desc:    columns[1],
			Details: columns[2],
			Vlan:    columns[3],
			Mod:     columns[4],
		}
		err = newTree.CreateSubnet(skeleton)
		if err != nil {
			return fmt.Errorf("error adding subnet regarding lineNum: %v because %v", lineNum, err)
		}
	}
	ipam.subnets.SwapTree(newTree)
	return nil
}

// IngestUserHistory is a wrapper around the OverwriteUserHistory method defined in ipam/server/history
func (ipam *IPAMServer) IngestUserHistory(history []string) {
	ipam.history.OverwriteUserHistory(history)
}

// IngestTinyDNSLines is a wrapper around the ParseTinyDNS method defined in ipam/server/dns
func (ipam *IPAMServer) IngestTinyDNSLines(dnslines []string) (processed, skipped int) {
	return ipam.dns.ParseTinyDNS(dnslines)
}

// IngestZoneFile is a wrapper around the ParseZoneFile method defined in ipam/server/dns
func (ipam *IPAMServer) IngestZoneFile(zonefile *os.File, origin string) (processed, skipped int) {
	return ipam.dns.ParseZoneFile(zonefile, origin, zonefile.Name())
}

// IngestNewBucket is a wrapper around the Swap method defined in ipam/server/history
func (ipam *IPAMServer) IngestNewBucket(newBucket *dns.Bucket) {
	ipam.dns.Swap(newBucket)
}
