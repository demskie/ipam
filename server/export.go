package server

import (
	"bytes"
	"encoding/csv"
)

// ExportSubnetCSVLines will returns slice of CSV lines
func (ipam *IPAMServer) ExportSubnetCSVLines() []string {
	allSubnets := ipam.subnets.GetAllSubnets()
	results := make([]string, len(allSubnets))
	buf := &bytes.Buffer{}
	writer := csv.NewWriter(buf)
	writer.Write([]string{
		"SUBNET",
		"DESCRIPTION",
		"DETAILS",
		"VLAN",
		"LASTMODIFIED",
	})
	for i, skeleton := range allSubnets {
		writer.Write([]string{
			skeleton.Net,
			skeleton.Desc,
			skeleton.Details,
			skeleton.Vlan,
			skeleton.Mod,
		})
		writer.Flush()
		results[i] = buf.String()
		buf.Reset()
	}
	return results
}
