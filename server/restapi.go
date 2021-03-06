package server

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/demskie/ipam/server/subnets"
	"github.com/demskie/subnetmath"
)

// curl http://localhost/api/subnets | python -m json.tool

func (ipam *IPAMServer) handleRestfulSubnets(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	results := ipam.subnets.GetJSON()
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	err := json.NewEncoder(w).Encode(results)
	if err != nil {
		log.Printf("failed serializing JSON for (%v) because %v\n", remoteIP, err.Error())
	}
}

// curl --header "Content-Type: application/json" --request GET \
//		--data '{"subnet":"192.168.0.0/24"}' \
//		http://localhost/api/hosts | python -m json.tool

func (ipam *IPAMServer) handleRestfulSpecificHosts(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	type incomingJSON struct {
		Subnet string `json:"subnet"`
	}
	var inMsg incomingJSON
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&inMsg)
	if err != nil {
		log.Printf("(%v) sent an invalid request: %v\n", remoteIP, err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	ip, network, err := net.ParseCIDR(inMsg.Subnet)
	if err != nil {
		log.Printf("(%v) sent an invalid subnetzero: %v\n", remoteIP, r.URL.String())
		http.Error(w, err.Error(), http.StatusNoContent)
		return
	} else if ip.Equal(network.IP) == false {
		log.Printf("(%v) sent an invalid subnetzero: %v\n", remoteIP, r.URL.String())
		http.Error(w, "specified IP address is not subnetzero", http.StatusNoContent)
		return
	}
	log.Printf("(%v) is requesting restfulHosts for %v\n", remoteIP, r.URL.String())
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	type hostJSON struct {
		Address         string `json:"address"`
		ForwardRecord   string `json:"forwardRecord"`
		PingResult      int    `json:"pingResult"`
		LastPingAttempt string `json:"lastPingAttempt"`
	}
	type outgoingJSON struct {
		Data []hostJSON `json:"data"`
	}
	sliceOfAddresses := []string{}
	currentIP := subnetmath.DuplicateAddr(network.IP)
	for network.Contains(currentIP) {
		sliceOfAddresses = append(sliceOfAddresses, currentIP.String())
		currentIP = subnetmath.NextAddr(currentIP)
	}
	forwardRecords := ipam.dns.GetFirstHostnameForAddresses(sliceOfAddresses)
	pingResults := ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses)
	lastPingAttempts := ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses)
	results := make([]hostJSON, len(sliceOfAddresses))
	for i := range sliceOfAddresses {
		results[i].Address = sliceOfAddresses[i]
		results[i].ForwardRecord = forwardRecords[i]
		results[i].PingResult, _ = strconv.Atoi(pingResults[i])
		results[i].LastPingAttempt = lastPingAttempts[i]
	}
	err = json.NewEncoder(w).Encode(outgoingJSON{
		Data: results,
	})
	if err != nil {
		log.Printf("failed serializing JSON for (%v) because %v\n", remoteIP, err.Error())
	}
}

// curl http://localhost/api/history | python -m json.tool

func (ipam *IPAMServer) handleRestfulHistory(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	log.Printf("(%v) is requesting restfulHistory\n", remoteIP)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	type outgoingJSON struct {
		History []string `json:"history"`
	}
	err := json.NewEncoder(w).Encode(outgoingJSON{
		History: ipam.history.GetAllUserActions(),
	})
	if err != nil {
		log.Printf("failed serializing historyJSON for (%v) because %v\n", remoteIP, err.Error())
	}
}

// curl --header "Content-Type: application/json" --request POST \
//		--data '{"subnet":"192.168.0.0/24", "description":"this is a test"}' \
//		http://localhost/api/createsubnet

func (ipam *IPAMServer) handleRestfulCreateSubnet(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	type incomingJSON struct {
		User        string `json:"user"`
		Pass        string `json:"pass"`
		Subnet      string `json:"subnet"`
		Description string `json:"description"`
		Details     string `json:"details"`
		Vlan        string `json:"vlan"`
	}
	var inMsg incomingJSON
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&inMsg)
	if err != nil {
		log.Printf("(%v) sent an invalid request - %v\n", remoteIP, err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	ipam.authCallbackMtx.RLock()
	if ipam.authCallback(inMsg.User, inMsg.Pass) == false {
		s := fmt.Sprintf("could not create subnet '%v' due to auth failure", inMsg.Subnet)
		http.Error(w, s, http.StatusUnauthorized)
		return
	}
	ipam.authCallbackMtx.RUnlock()
	newSkeleton := &subnets.SubnetSkeleton{
		Net:     inMsg.Subnet,
		Desc:    inMsg.Description,
		Details: inMsg.Details,
		Vlan:    inMsg.Vlan,
		Mod:     time.Now().Format(defaultTimeLayout),
	}
	err = ipam.subnets.CreateSubnet(newSkeleton)
	if err != nil {
		message := fmt.Sprintf("could not create '%v' because %v", newSkeleton.Net, err.Error())
		log.Printf("(%v) sent an invalid request - %v\n", remoteIP, message)
		http.Error(w, message, http.StatusNoContent)
		return
	}
	msg := ipam.history.RecordUserAction(remoteIP, "creating subnet", newSkeleton.ToSlice())
	ipam.signalMutation(msg)
	io.WriteString(w, "operation successful")
}

// curl --header "Content-Type: application/json" --request POST \
//		--data '{"subnet":"192.168.0.0/24", "description":"overwrite the previous description"}' \
//		http://localhost/api/replacesubnet

func (ipam *IPAMServer) handleRestfulReplaceSubnet(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	type incomingJSON struct {
		User        string `json:"user"`
		Pass        string `json:"pass"`
		Subnet      string `json:"subnet"`
		Description string `json:"description"`
		Details     string `json:"details"`
		Vlan        string `json:"vlan"`
	}
	var inMsg incomingJSON
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&inMsg)
	if err != nil {
		log.Printf("(%v) sent an invalid request - %v\n", remoteIP, err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	ipam.authCallbackMtx.RLock()
	if ipam.authCallback(inMsg.User, inMsg.Pass) == false {
		s := fmt.Sprintf("could not reserve subnet '%v' due to auth failure", inMsg.Subnet)
		http.Error(w, s, http.StatusUnauthorized)
		return
	}
	ipam.authCallbackMtx.RUnlock()
	network := subnetmath.ParseNetworkCIDR(inMsg.Subnet)
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	newSkeleton := &subnets.SubnetSkeleton{
		Net:     inMsg.Subnet,
		Desc:    inMsg.Description,
		Details: inMsg.Details,
		Vlan:    inMsg.Vlan,
		Mod:     time.Now().Format(defaultTimeLayout),
	}
	differences := oldSkeleton.ListDifferences(newSkeleton)
	if differences == nil {
		message := fmt.Sprintf("could not modify '%v' because there were no changes", network)
		log.Printf("(%v) sent an invalid request - %v\n", remoteIP, message)
		http.Error(w, message, http.StatusNoContent)
		return
	}
	err = ipam.subnets.ReplaceSubnet(newSkeleton)
	if err != nil {
		message := fmt.Sprintf("could not modify '%v' because %v", newSkeleton.Net, err.Error())
		log.Printf("(%v) sent an invalid request - %v\n", remoteIP, message)
		http.Error(w, message, http.StatusNoContent)
		return
	}
	msg := ipam.history.RecordUserAction(remoteIP, "pushing changes", differences)
	ipam.signalMutation(msg)
	io.WriteString(w, "operation successful")
}

// curl --header "Content-Type: application/json" --request POST \
//	 	--data '{"subnet":"192.168.0.0/24"}' \
//		http://localhost/api/deletesubnet

func (ipam *IPAMServer) handleRestfulDeleteSubnet(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	type incomingJSON struct {
		User   string `json:"user"`
		Pass   string `json:"pass"`
		Subnet string `json:"subnet"`
	}
	var inMsg incomingJSON
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&inMsg)
	if err != nil {
		log.Println(remoteIP, "sent an invalid request -", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	ipam.authCallbackMtx.RLock()
	if ipam.authCallback(inMsg.User, inMsg.Pass) == false {
		s := fmt.Sprintf("could not delete '%v' due to auth failure", inMsg.Subnet)
		http.Error(w, s, http.StatusUnauthorized)
		return
	}
	ipam.authCallbackMtx.RUnlock()
	network := subnetmath.ParseNetworkCIDR(inMsg.Subnet)
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	if network == nil || ipam.subnets.DeleteSubnet(network) != nil {
		message := fmt.Sprintf("could not delete '%v' as it does not exist", inMsg.Subnet)
		http.Error(w, message, http.StatusNoContent)
		return
	}
	msg := ipam.history.RecordUserAction(remoteIP, "deleting subnet", oldSkeleton.ToSlice())
	ipam.signalMutation(msg)
	io.WriteString(w, "operation successful")
}

// curl --header "Content-Type: application/json" --request POST \
// 		--data '{"subnet":"10.128.8.0/21", "description":"MyDockerService", "details":"jira123456789"}' \
// 		http://localhost/api/reservehost

func (ipam *IPAMServer) handleRestfulReserveHost(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	type incomingJSON struct {
		User        string `json:"user"`
		Pass        string `json:"pass"`
		Subnet      string `json:"subnet"`
		Description string `json:"description"`
		Details     string `json:"details"`
	}
	var inMsg incomingJSON
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&inMsg)
	if err != nil {
		log.Println(remoteIP, "sent an invalid request -", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	ipam.authCallbackMtx.RLock()
	if ipam.authCallback(inMsg.User, inMsg.Pass) == false {
		s := fmt.Sprintf("could not reserve host in '%v' due to auth failure", inMsg.Subnet)
		http.Error(w, s, http.StatusUnauthorized)
		return
	}
	ipam.authCallbackMtx.RUnlock()
	network := subnetmath.ParseNetworkCIDR(inMsg.Subnet)
	if network == nil {
		http.Error(w, fmt.Sprintf("'%v' is not a valid subnet", inMsg.Subnet), http.StatusBadRequest)
		return
	} else if ipam.subnets.GetSubnetSkeleton(network) == nil {
		http.Error(w, fmt.Sprintf("'%v' does not exist", network), http.StatusBadRequest)
		return
	}
	cidr := 32
	if network.IP.To4() == nil {
		cidr = 128
	}
	host, err := ipam.subnets.CreateAvailableSubnet(network, inMsg.Description, inMsg.Details, "", cidr)
	if err != nil {
		log.Println(remoteIP, "request failed because", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	slc := []string{
		fmt.Sprintf("net='%s'", host),
		fmt.Sprintf("desc='%v'", inMsg.Description),
		fmt.Sprintf("details='%v'", inMsg.Details),
	}
	msg := ipam.history.RecordUserAction(remoteIP, "reserving host", slc)
	ipam.signalMutation(msg)
	io.WriteString(w, host)
}

// curl --header "Content-Type: application/json" --request POST \
// 		--data '{"supernet":"10.128.0.0/16", "subnetCIDR":24, "description":"MyThingy", "details":"jira123456789"}' \
// 		http://localhost/api/reservesubnet

func (ipam *IPAMServer) handleRestfulReserveSubnet(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	type incomingJSON struct {
		User        string `json:"user"`
		Pass        string `json:"pass"`
		Supernet    string `json:"supernet"`
		SubnetCIDR  int    `json:"subnetCIDR"`
		Description string `json:"description"`
		Details     string `json:"details"`
		Vlan        string `json:"vlan"`
	}
	var inMsg incomingJSON
	err := json.NewDecoder(r.Body).Decode(&inMsg)
	if err != nil {
		log.Println(remoteIP, "sent an invalid request -", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	ipam.authCallbackMtx.RLock()
	if ipam.authCallback(inMsg.User, inMsg.Pass) == false {
		s := fmt.Sprintf("could not reserve subnet of '%v' due to auth failure", inMsg.Supernet)
		http.Error(w, s, http.StatusUnauthorized)
		return
	}
	ipam.authCallbackMtx.RUnlock()
	supernet := subnetmath.ParseNetworkCIDR(inMsg.Supernet)
	if supernet == nil {
		http.Error(w, fmt.Sprintf("'%v' is not a valid supernet", inMsg.Supernet), http.StatusBadRequest)
		return
	} else if ipam.subnets.GetSubnetSkeleton(supernet) == nil {
		http.Error(w, fmt.Sprintf("'%v' does not exist", supernet), http.StatusBadRequest)
		return
	}
	subnet, err := ipam.subnets.CreateAvailableSubnet(supernet, inMsg.Description, inMsg.Details, inMsg.Vlan, inMsg.SubnetCIDR)
	if err != nil {
		log.Println(remoteIP, "request failed because", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	slc := []string{
		fmt.Sprintf("net='%s'", subnet),
		fmt.Sprintf("desc='%v'", inMsg.Description),
		fmt.Sprintf("details='%v'", inMsg.Details),
	}
	msg := ipam.history.RecordUserAction(remoteIP, "reserving subnet", slc)
	ipam.signalMutation(msg)
	io.WriteString(w, subnet)
}
