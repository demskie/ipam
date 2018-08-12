package subnets

import (
	"net"
	"sync"
)

type subnet struct {
	network      *net.IPNet
	description  string
	modifiedTime string
	vlan         string
	details      string
	parent       *subnet
	children     []*subnet
}

// Tree contains the root subnets
type Tree struct {
	mtx   *sync.RWMutex
	roots []*subnet
}

// NewTree creates a new Tree object
func NewTree() *Tree {
	return &Tree{
		mtx:   &sync.RWMutex{},
		roots: make([]*subnet, 0),
	}
}

const defaultTimeLayout string = "01-02-2006 15:04:05"
