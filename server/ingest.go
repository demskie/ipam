package server

import (
	"encoding/csv"
	"fmt"
	"log"
	"net"
	"strings"

	"github.com/demskie/ipam/server/subnets"
)

// IngestSubnetCSVLines will overwrite all existing subnetTree data with the csvlines being passed in
func (ipam *IPAMServer) IngestSubnetCSVLines(csvlines []string, verbose bool) (processed, skipped int, err error) {
	newTree := subnets.NewTree()
	subnetColumns := make([][]string, 0, len(csvlines))
	for lineNum, line := range csvlines {
		if lineNum == 0 && strings.Contains(line, "subnet,") {
			if verbose {
				log.Println("auto skipping line 0 as it appears to be spreadsheet header")
			}
			subnetColumns = append(subnetColumns, []string{"SKIP_ME"})
			continue
		} else if len(line) > 0 && strings.HasPrefix(line, "#") {
			if verbose {
				log.Printf("skipping line %v as it is commented out\n", lineNum+1)
			}
			subnetColumns = append(subnetColumns, []string{"SKIP_ME"})
			continue
		}
		val, err := csv.NewReader(strings.NewReader(line)).Read()
		if len(val) > 3 && err == nil {
			subnetColumns = append(subnetColumns, val)
		}
	}
	for lineNum, columns := range subnetColumns {
		if len(columns) == 1 && columns[0] == "SKIP_ME" {
			continue
		}
		if len(columns) < 3 {
			err = fmt.Errorf("line %v is not formatted correctly", lineNum+1)
			return processed, skipped, err
		}
		subnetString, description, modifiedTime := columns[0], columns[1], columns[2]
		var vlan, details string
		if len(columns) >= 5 {
			vlan, details = columns[3], columns[4]
		} else if len(columns) >= 4 {
			vlan = columns[3]
		}
		ip, subzero, err := net.ParseCIDR(subnetString)
		if err != nil {
			err = fmt.Errorf("error parsing line %v > %v", lineNum+1, err)
			return processed, skipped, err
		} else if subzero.IP.Equal(ip) == false {
			err = fmt.Errorf("error parsing line %v contains %v which is not a valid network address", lineNum+1, ip)
			return processed, skipped, err
		}
		skeleton := &subnets.SubnetSkeleton{
			Net:     subzero.String(),
			Desc:    description,
			Mod:     modifiedTime,
			Vlan:    vlan,
			Details: details,
		}
		err = newTree.CreateSubnet(skeleton)
		if err != nil {
			err = fmt.Errorf("error adding subnet regarding lineNum: %v because %v", lineNum, err)
			return processed, skipped, err
		}
		processed++
	}
	ipam.subnets.SwapTree(newTree)
	return processed, skipped, err
}

// IngestTinyDNSLines is a wrapper around the import method defined in ipam/server/dns
func (ipam *IPAMServer) IngestTinyDNSLines(dnslines []string) {
	if len(dnslines) == 0 {
		log.Println("unable to fetch int-dns/data or ext-dns/data from gitlab")
		return
	}
	processed, skipped := ipam.dns.ParseTinyDNS(dnslines)
	log.Printf("imported %v TinyDNS entries and skipped %v\n", processed, skipped)
}
