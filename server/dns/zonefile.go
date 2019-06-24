package dns

import (
	"bufio"
	"bytes"
	"io"
	"strings"

	miekgdns "github.com/miekg/dns"
)

// ParseZoneFile will import the forward records from a BIND zonefile
func (b *Bucket) ParseZoneFile(r io.Reader, origin, filename string) (processed, skipped int) {
	b.mtx.Lock()
	defer b.mtx.Unlock()
	scanner := bufio.NewScanner(r)
	var lastHostname string
	for scanner.Scan() {
		tokenChan := miekgdns.ParseZone(bytes.NewReader(scanner.Bytes()), origin, filename)
		for token := range tokenChan {
			if token.RR == nil {
				skipped++
				continue
			}
			switch token.RR.Header().Rrtype {
			case miekgdns.TypeA:
				addr := token.RR.(*miekgdns.A).A
				if token.RR.(*miekgdns.A).Hdr.Name != "" {
					lastHostname = token.RR.(*miekgdns.A).Hdr.Name
					if strings.HasSuffix(lastHostname, ".") {
						lastHostname = lastHostname[:len(lastHostname)-1]
					}
				}
				b.addrToHostnames[addr.String()] = appendToSliceIfMissing(b.addrToHostnames[addr.String()], lastHostname)
				b.hostnameToAddr[lastHostname] = addr.String()
				processed++
			case miekgdns.TypeAAAA:
				addr := token.RR.(*miekgdns.AAAA).AAAA
				if token.RR.(*miekgdns.AAAA).Hdr.Name != "" {
					lastHostname = token.RR.(*miekgdns.AAAA).Hdr.Name
					if strings.HasSuffix(lastHostname, ".") {
						lastHostname = lastHostname[:len(lastHostname)-1]
					}
				}
				b.addrToHostnames[addr.String()] = appendToSliceIfMissing(b.addrToHostnames[addr.String()], lastHostname)
				b.hostnameToAddr[lastHostname] = addr.String()
				processed++
			default:
				skipped++
			}
		}
	}
	return processed, skipped
}
