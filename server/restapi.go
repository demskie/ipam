package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/demskie/ipam/server/ping"
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

func (ipam *IPAMServer) handleRestfulHosts(w http.ResponseWriter, r *http.Request) {
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
	addressCount := ping.GetNumberOfHosts(network)
	currentIP := subnetmath.DuplicateNetwork(network).IP
	sliceOfAddresses := make([]string, addressCount)
	for i := 0; i < addressCount; i++ {
		sliceOfAddresses[i] = currentIP.String()
		currentIP = subnetmath.AddToAddr(currentIP, 1)
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
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("operation successful"))
}

// curl --header "Content-Type: application/json" --request POST \
//		--data '{"subnet":"192.168.0.0/24", "description":"overwrite the previous description"}' \
//		http://localhost/api/replacesubnet

func (ipam *IPAMServer) handleRestfulReplaceSubnet(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	type incomingJSON struct {
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
	network := subnetmath.BlindlyParseCIDR(inMsg.Subnet)
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
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("operation successful"))
}

// curl --header "Content-Type: application/json" --request POST \
//	 	--data '{"subnet":"192.168.0.0/24"}' \
//		http://localhost/api/deletesubnet

func (ipam *IPAMServer) handleRestfulDeleteSubnet(w http.ResponseWriter, r *http.Request) {
	remoteIP, _, _ := net.SplitHostPort(r.RemoteAddr)
	type incomingJSON struct {
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
	network := subnetmath.BlindlyParseCIDR(inMsg.Subnet)
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	if network == nil || ipam.subnets.DeleteSubnet(network) != nil {
		message := fmt.Sprintf("could not delete '%v' as it does not exist", inMsg.Subnet)
		http.Error(w, message, http.StatusNoContent)
		return
	}
	msg := ipam.history.RecordUserAction(remoteIP, "deleting subnet", oldSkeleton.ToSlice())
	ipam.signalMutation(msg)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("operation successful"))
}
