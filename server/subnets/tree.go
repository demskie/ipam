package subnets

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net"
	"sort"
	"sync"
	"time"

	"github.com/demskie/randutil"
	"github.com/demskie/subnetmath"
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

// CreateSubnet will add a valid subnet to the tree
func (tree *Tree) CreateSubnet(skeleton *SubnetSkeleton) error {
	tree.mtx.Lock()
	defer tree.mtx.Unlock()
	// creating a new subnet object
	network := subnetmath.BlindlyParseCIDR(skeleton.Net)
	if network == nil {
		return errors.New("invalid CIDR network")
	}
	newSubnet := &subnet{
		network:      network,
		description:  skeleton.Desc,
		modifiedTime: skeleton.Mod,
		vlan:         skeleton.Vlan,
		details:      skeleton.Details,
		parent:       getDeepestParent(network, tree.roots),
	}
	// ensure that this subnet does not already exist
	if newSubnet.parent != nil &&
		subnetmath.NetworksAreIdentical(newSubnet.parent.network, newSubnet.network) {
		return fmt.Errorf("%v already exists", newSubnet.network)
	}
	// deletions will need to occur outside the upcoming loops to avoid corruption
	relocatedSubnets := []*subnet{}
	// check if we have a parent
	if newSubnet.parent == nil {
		// sweep through existing subnets without a parent
		for _, otherSubnet := range tree.roots {
			if newSubnet.network.Contains(otherSubnet.network.IP) {
				// ensure that this subnet does not already exist
				if subnetmath.NetworksAreIdentical(newSubnet.network, otherSubnet.network) {
					return fmt.Errorf("%v already exists", newSubnet.network)
				}
				// remove subnet from the base of the tree
				relocatedSubnets = append(relocatedSubnets, otherSubnet)
				// make ourselves the parent
				otherSubnet.parent = newSubnet
				newSubnet.children = insertIntoSortedSubnets(newSubnet.children, otherSubnet)
			}
		}
		// remove any subnets that were moved out of the base of the tree
		for _, otherSubnet := range relocatedSubnets {
			tree.roots = removeSubnetFromSlice(tree.roots, otherSubnet)
		}
		// add ourselves to the base of the tree
		tree.roots = insertIntoSortedSubnets(tree.roots, newSubnet)
	} else {
		// sweep through adjacent children
		for _, sibling := range newSubnet.parent.children {
			// see if we should be their parent
			if newSubnet.network.Contains(sibling.network.IP) {
				// ensure that this subnet does not already exist
				if subnetmath.NetworksAreIdentical(newSubnet.network, sibling.network) {
					return fmt.Errorf("%v already exists", newSubnet.network)
				}
				// remove child from previous parent
				relocatedSubnets = append(relocatedSubnets, sibling)
				// make ourselves the parent
				sibling.parent = newSubnet
				newSubnet.children = insertIntoSortedSubnets(newSubnet.children, sibling)
			}
		}
		// remove any subnets that were moved away from their original parent
		for _, sibling := range relocatedSubnets {
			newSubnet.parent.children = removeSubnetFromSlice(newSubnet.parent.children, sibling)
		}
		// add ourselves to the parent we found
		newSubnet.parent.children = insertIntoSortedSubnets(newSubnet.parent.children, newSubnet)
	}
	return nil
}

// ReplaceSubnet will override all values on an existing subnet
func (tree *Tree) ReplaceSubnet(skeleton *SubnetSkeleton) error {
	network := subnetmath.BlindlyParseCIDR(skeleton.Net)
	if network == nil {
		return errors.New("invalid subnet")
	}
	tree.mtx.Lock()
	defer tree.mtx.Unlock()
	sn := findSubnet(network, tree.roots)
	if sn == nil {
		return errors.New("subnet not found")
	}
	sn.description = skeleton.Desc
	sn.vlan = skeleton.Vlan
	sn.details = skeleton.Details
	sn.modifiedTime = time.Now().Format(defaultTimeLayout)
	return nil
}

// DeleteSubnet will remove the subnet (BUG: and all its children)
func (tree *Tree) DeleteSubnet(network *net.IPNet) error {
	tree.mtx.Lock()
	defer tree.mtx.Unlock()
	sn := findSubnet(network, tree.roots)
	if sn == nil {
		return errors.New("subnet not found")
	}
	for _, child := range sn.children {
		if sn.parent == nil {
			tree.roots = insertIntoSortedSubnets(tree.roots, child)
		} else {
			child.parent = sn.parent
		}
	}
	if sn.parent == nil {
		tree.roots = removeSubnetFromSlice(tree.roots, sn)
	} else {
		sn.parent.children = removeSubnetFromSlice(sn.parent.children, sn)
	}
	return nil
}

func findSubnet(network *net.IPNet, objects []*subnet) *subnet {
	for _, obj := range objects {
		if obj.network.Contains(network.IP) {
			if subnetmath.NetworksAreIdentical(obj.network, network) {
				return obj
			}
			return findSubnet(network, obj.children)
		}
	}
	return nil
}

func getDeepestParent(orig *net.IPNet, parents []*subnet) (parent *subnet) {
	for _, sn := range parents {
		snMask, _ := sn.network.Mask.Size()
		origMask, _ := orig.Mask.Size()
		if snMask < origMask && sn.network.Contains(orig.IP) {
			deeper := getDeepestParent(orig, sn.children)
			if deeper != nil {
				return deeper
			}
			return sn
		}
	}
	return nil
}

func insertIntoSortedSubnets(slc []*subnet, sn *subnet) []*subnet {
	index := sort.Search(len(slc), func(i int) bool {
		return subnetmath.NetworkComesBefore(slc[i].network, sn.network)
	})
	slc = append(slc, &subnet{})
	copy(slc[index+1:], slc[index:])
	slc[index] = sn
	return slc
}

func removeSubnetFromSlice(slc []*subnet, sn *subnet) []*subnet {
	for i := range slc {
		if slc[i] == sn {
			copy(slc[i:], slc[i+1:])
			slc[len(slc)-1] = nil
			return slc[:len(slc)-1]
		}
	}
	return slc
}

func getSubnetChildren(children []*subnet, allSubnets []*subnet) []*subnet {
	allSubnets = append(allSubnets, children...)
	for _, child := range children {
		allSubnets = getSubnetChildren(child.children, allSubnets)
	}
	return allSubnets
}

// GetRandomNetwork will choose a weighted pseudorandom network based on size
func (tree *Tree) GetRandomNetwork(rnum *rand.Rand) *net.IPNet {
	tree.mtx.RLock()
	defer tree.mtx.RUnlock()
	subnets := tree.roots
	for _, root := range tree.roots {
		subnets = append(subnets, getSubnetChildren(root.children, []*subnet{})...)
	}
	allChoices := make([]randutil.WeightedObj, len(subnets))
	for i := range allChoices {
		_, numZeros := subnets[i].network.Mask.Size()
		allChoices[i] = randutil.WeightedObj{
			Weight: numZeros,
			Object: subnets[i],
		}
	}
	choice, err := randutil.WeightedChoice(allChoices, rnum)
	if err != nil {
		log.Fatal("weightedChoice >", err.Error())
	}
	return subnetmath.DuplicateNetwork(choice.Object.(*subnet).network)
}

// SwapTree will safely replace the the existing tree
func (tree *Tree) SwapTree(newTree *Tree) {
	tree.mtx.Lock()
	tree.roots = newTree.roots
	tree.mtx.Unlock()
}
