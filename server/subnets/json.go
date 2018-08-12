package subnets

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

// GetJSON returns a nested SubnetJSON structure
func (tree *Tree) GetJSON() []SubnetJSON {
	tree.mtx.RLock()
	defer tree.mtx.RUnlock()
	result := []SubnetJSON{}
	for _, sn := range tree.roots {
		result = append(result, nestedSubnetJSON(sn)...)
	}
	return result
}

func nestedSubnetJSON(sn *subnet) []SubnetJSON {
	result := []SubnetJSON{}
	// do some stuff
	return result
}
