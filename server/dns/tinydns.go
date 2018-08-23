package dns

import (
	"strings"
)

// ParseTinyDNS imports lines of strings formatted with TinyDNS syntax
func (b *Bucket) ParseTinyDNS(lines []string) (processed, skipped int) {
	b.mtx.Lock()
	defer b.mtx.Unlock()
	for _, line := range lines {
		if len(line) == 0 {
			skipped++
			continue
		}
		switch string(line[0]) {
		case "=":
			s := strings.Split(line[1:], ":")
			if len(s) == 3 {
				host := strings.TrimSuffix(s[0], ".")
				addr := strings.TrimSuffix(s[1], ".")
				b.forwardRecords[addr] = appendToSliceIfMissing(b.forwardRecords[addr], host)
				b.reverseRecords[addr] = host
				processed++
			}
		case "+", "C":
			s := strings.Split(line[1:], ":")
			if len(s) == 3 {
				first := strings.TrimSuffix(s[0], ".")
				second := strings.TrimSuffix(s[1], ".")
				b.forwardRecords[second] = appendToSliceIfMissing(b.forwardRecords[second], first)
				processed++
			}
		case "^":
			s := strings.Split(line[1:], ":")
			if len(s) == 3 {
				first := strings.TrimSuffix(s[0], ".in-addr.arpa")
				second := strings.TrimSuffix(s[1], ".")
				b.reverseRecords[first] = second
				processed++
			}
		default:
			skipped++
		}
	}
	return processed, skipped
}
