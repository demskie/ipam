package subnets

import (
	"fmt"
	"net"
)

// SubnetSkeleton is an inbetween data type to simplify marshalling
type SubnetSkeleton struct {
	Net, Desc, Vlan, Details, Mod string
}

func (subnet *subnet) toSkeleton() *SubnetSkeleton {
	if subnet != nil {
		return &SubnetSkeleton{
			Net:     subnet.network.String(),
			Desc:    subnet.description,
			Vlan:    subnet.vlan,
			Details: subnet.details,
			Mod:     subnet.modifiedTime,
		}
	}
	return nil
}

// GetSubnetSkeleton will return the skeleton version of a subnet if it exists
func (tree *Tree) GetSubnetSkeleton(network *net.IPNet) *SubnetSkeleton {
	tree.mtx.RLock()
	defer tree.mtx.RUnlock()
	return findSubnet(network, tree.roots).toSkeleton()
}

// ListDifferences will return a slice of strings demonstrating the differences
func (skeleton *SubnetSkeleton) ListDifferences(otherSkeleton *SubnetSkeleton) []string {
	differences := []string{fmt.Sprintf("net='%v'", otherSkeleton.Net)}
	if skeleton.Desc != otherSkeleton.Desc {
		differences = append(differences, fmt.Sprintf("desc='%v'", otherSkeleton.Desc))
	}
	if skeleton.Vlan != otherSkeleton.Vlan {
		differences = append(differences, fmt.Sprintf("vlan='%v'", otherSkeleton.Vlan))
	}
	if skeleton.Details != otherSkeleton.Details {
		differences = append(differences, fmt.Sprintf("details='%v'", otherSkeleton.Details))
	}
	if len(differences) > 1 {
		return differences
	}
	return nil
}

// ToSlice returns a string slice version of the skeleton
func (skeleton *SubnetSkeleton) ToSlice() []string {
	return []string{
		fmt.Sprintf("net='%v'", skeleton.Net),
		fmt.Sprintf("desc='%v'", skeleton.Desc),
		fmt.Sprintf("vlan='%v'", skeleton.Vlan),
		fmt.Sprintf("details='%v'", skeleton.Details),
	}
}
