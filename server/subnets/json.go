package subnets

import "strconv"

// SubnetJSON is the data format consumed by websocket client
type SubnetJSON struct {
	ID         string       `json:"id"`
	Net        string       `json:"net"`
	Desc       string       `json:"desc"`
	Vlan       string       `json:"vlan"`
	ModTime    string       `json:"modTime"`
	Notes      string       `json:"notes"`
	ChildNodes []SubnetJSON `json:"childNodes"`
}

// GetJSON returns the nested SubnetJSON structure for the websocket client
func (tree *Tree) GetJSON() []SubnetJSON {
	tree.mtx.RLock()
	var i int
	results := make([]SubnetJSON, len(tree.roots))
	for j, subnet := range tree.roots {
		i, results[j] = getNestedSubnetJSON(i, subnet)
	}
	tree.mtx.RUnlock()
	return results
}

func getNestedSubnetJSON(i int, sn *subnet) (int, SubnetJSON) {
	results := SubnetJSON{
		ID:         strconv.Itoa(i),
		Net:        sn.network.String(),
		Desc:       sn.description,
		Vlan:       sn.vlan,
		ModTime:    sn.modifiedTime,
		Notes:      sn.details,
		ChildNodes: make([]SubnetJSON, len(sn.children)),
	}
	i++
	for j, child := range sn.children {
		i, results.ChildNodes[j] = getNestedSubnetJSON(i, child)
	}
	return i, results
}
