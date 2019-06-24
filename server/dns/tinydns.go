package dns

import (
	"bufio"
	"io"
	"strings"
)

// ParseTinyDNS imports lines of strings formatted with TinyDNS syntax
func (b *Bucket) ParseTinyDNS(r io.Reader) (processed, skipped int) {
	b.mtx.Lock()
	defer b.mtx.Unlock()
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := scanner.Text()
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
				b.addrToHostnames[addr] = appendToSliceIfMissing(b.addrToHostnames[addr], host)
				b.hostnameToAddr[host] = addr
				processed++
			}
		case "+":
			s := strings.Split(line[1:], ":")
			if len(s) == 3 {
				first := strings.TrimSuffix(s[0], ".")
				second := strings.TrimSuffix(s[1], ".")
				b.addrToHostnames[second] = appendToSliceIfMissing(b.addrToHostnames[second], first)
				processed++
			}
		case "^":
			s := strings.Split(line[1:], ":")
			if len(s) == 3 {
				first := strings.TrimSuffix(s[0], ".in-addr.arpa")
				second := strings.TrimSuffix(s[1], ".")
				b.hostnameToAddr[second] = first
				processed++
			}
		default:
			skipped++
		}
	}
	return processed, skipped
}
