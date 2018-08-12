package server

import "sync"

const (
	defaultTimeLayout = "01-02-2006 15:04:05"
)

// IPAMServer is the object used to mutate and read data
type IPAMServer struct {
	subnets     *subnets.Tree
	history     *history.Records
	debug       *history.ServerLogger
	dns         *dns.Resolver
	pinger      *ping.Pinger
	mutationMtx *sync.Mutex
}

// NewIPAMServer returns a new server object
func NewIPAMServer() *IPAMServer {
	return &IPAMServer{
		subnets:     subnets.NewTree(),
		history:     history.NewRecords(),
		debug:       history.NewServerLogger(),
		dns:         dns.NewResolver(),
		pinger:      ping.NewPinger(),
		mutationMtx: &sync.Mutex{},
	}
}
