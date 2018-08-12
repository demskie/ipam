package server

import (
	"log"
	"strings"

	"github.com/demskie/ipam/server/subnets"
)

// IngestSubnetCSVLines will overwrite all existing subnetTree data with the csvlines being passed in
func (ipam *IPAMServer) IngestSubnetCSVLines(csvlines []string, verbose bool) (processed, skipped int) {
	newTree := subnets.NewTree()
	subnetColumns := make([][]string, 0, len(csvlines))
	for lineNum, line := range csvlines {
		if lineNum == 0 && strings.Contains(line, "subnet,") {
			if verbose {
				log.Println("auto skipping line 0 as it appears to be spreadsheet header")
			}
			subnetColumns = append(subnetColumns, []string{"SKIP_ME"})
			continue
		}
	}
	ipam.subnets.SwapTree(newTree)
	return processed, skipped
}
