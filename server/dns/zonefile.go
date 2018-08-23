package dns

import (
	"bufio"
	"bytes"
	"os"

	miekgdns "github.com/miekg/dns"
)

// ParseZoneFile will import the forward records from a BIND zonefile
func (b *Bucket) ParseZoneFile(f *os.File, origin, filename string) (processed, skipped int) {
	scanner := bufio.NewScanner(f)
	var lastHostname string
	b.mtx.Lock()
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
				}
				b.forwardRecords[lastHostname] = append(b.forwardRecords[lastHostname], addr.String())
				b.reverseRecords[addr.String()] = lastHostname
				processed++
			case miekgdns.TypeAAAA:
				addr := token.RR.(*miekgdns.AAAA).AAAA
				if token.RR.(*miekgdns.AAAA).Hdr.Name != "" {
					lastHostname = token.RR.(*miekgdns.AAAA).Hdr.Name
				}
				b.forwardRecords[lastHostname] = append(b.forwardRecords[lastHostname], addr.String())
				b.reverseRecords[addr.String()] = lastHostname
				processed++
			default:
				skipped++
			}
		}
	}
	b.mtx.Unlock()
	return processed, skipped
}