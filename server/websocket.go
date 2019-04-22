package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/demskie/subnetmath"

	"github.com/demskie/ipam/server/ping"
	"github.com/demskie/ipam/server/subnets"
	"github.com/gorilla/websocket"
)

type baseMessage struct {
	MessageType float64 `json:"messageType"`
	SessionGUID string  `json:"sessionGUID"`
}

// MessageTypes
const (
	Ping float64 = iota
	GenericError
	GenericInfo
	AllSubnets
	SomeSubnets
	SpecificHosts
	SomeHosts
	History
	DebugLog
	ManualPingScan
	CreateSubnet
	ModifySubnet
	DeleteSubnet
)

func (ipam *IPAMServer) handleWebsocketClient(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		HandshakeTimeout:  30 * time.Second,
		ReadBufferSize:    1024,
		WriteBufferSize:   1024,
		EnableCompression: true,
		CheckOrigin:       func(r *http.Request) bool { return true },
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()
	conn.EnableWriteCompression(true)
	conn.SetCompressionLevel(1)
	conn.SetReadLimit(1000000) // one megabyte
	// reused bytes
	var (
		networkIn bytes.Buffer
		decJSON   = json.NewDecoder(&networkIn)
	)
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	for {
		// receive data from client
		msgType, newData, err := conn.ReadMessage()
		if err != nil {
			if strings.Contains(err.Error(), "websocket: close 1001 (going away)") ||
				strings.Contains(err.Error(), "connection reset by peer") {
				return
			}
			log.Printf("error receiving message from (%v) > %v\n", remoteIP, err)
		}
		if msgType != websocket.TextMessage {
			log.Printf("received an invalid message from (%v)\n", remoteIP)
			return
		}
		networkIn.Reset()
		networkIn.Write(newData)
		inMsg := baseMessage{}
		err = decJSON.Decode(&inMsg)
		if err != nil {
			log.Printf("error decoding incoming message from (%v)\n", remoteIP)
			return
		}
		networkIn.Reset()
		networkIn.Write(newData)
		// send response to client
		switch inMsg.MessageType {
		case Ping:
			ipam.handlePing(conn, inMsg.SessionGUID)
		case GenericError:
			log.Printf("received invalid requestType (GenericError) from (%v)\n", remoteIP)
		case GenericInfo:
			log.Printf("received invalid requestType (GenericInfo) from (%v)\n", remoteIP)
		case AllSubnets:
			ipam.handleAllSubnets(conn, inMsg.SessionGUID)
		case SomeSubnets:
			ipam.handleSomeSubnets(conn, decJSON)
		case SpecificHosts:
			ipam.handleSpecificHosts(conn, decJSON)
		case SomeHosts:
			ipam.handleSomeHosts(conn, decJSON)
		case History:
			ipam.handleHistory(conn, inMsg.SessionGUID)
		case DebugLog:
			ipam.handleDebugLog(conn, inMsg.SessionGUID)
		case ManualPingScan:
			ipam.handleManualPingScan(conn, decJSON)
		case CreateSubnet:
			ipam.handleCreateSubnet(conn, decJSON)
		case ModifySubnet:
			ipam.handleModifySubnet(conn, decJSON)
		case DeleteSubnet:
			ipam.handleDeleteSubnet(conn, decJSON)
		default:
			log.Printf("received unknown request from (%v)\n", remoteIP)
		}
	}
}

type outboundPing struct {
	baseMessage
	DemoMode bool `json:"demoMode"`
}

func (ipam *IPAMServer) handlePing(conn *websocket.Conn, guid string) {
	outMsg := outboundPing{}
	outMsg.MessageType = Ping
	outMsg.SessionGUID = guid
	outMsg.DemoMode = ipam.demoModeBool
	b, err := json.Marshal(outMsg)
	if err != nil {
		remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
		log.Printf("error encoding outgoing Ping to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

// errorType
const (
	InvalidSubnet float64 = iota
	NotSubnetZero
	DoesNotExist
	AlreadyExists
	AuthenticationFailure
	UnknownFault
)

type outboundGenericError struct {
	baseMessage
	ErrorType  float64 `json:"errorType"`
	ErrorValue string  `json:"errorValue"`
}

func sendGenericError(conn *websocket.Conn, message string, guid string, errorType int) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	outMsg := outboundGenericError{}
	outMsg.MessageType = GenericError
	outMsg.SessionGUID = guid
	outMsg.ErrorType = float64(errorType)
	outMsg.ErrorValue = message
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing error message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type outboundGenericInfo struct {
	baseMessage
	Info string `json:"info"`
}

func sendGenericInfo(conn *websocket.Conn, message string, guid string) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	outMsg := outboundGenericInfo{}
	outMsg.MessageType = GenericInfo
	outMsg.SessionGUID = guid
	outMsg.Info = message
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing info message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type outboundAllSubnets struct {
	baseMessage
	Subnets []subnets.SubnetJSON `json:"subnets"`
}

func (ipam *IPAMServer) handleAllSubnets(conn *websocket.Conn, guid string) {
	outMsg := outboundAllSubnets{}
	outMsg.MessageType = AllSubnets
	outMsg.SessionGUID = guid
	outMsg.Subnets = ipam.subnets.GetJSON()
	b, err := json.Marshal(outMsg)
	if err != nil {
		remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
		log.Printf("error encoding outgoing AllSubnets to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type inboundSomeSubnets struct {
	baseMessage
	Filter string `json:"filter"`
}

type outboundSomeSubnets struct {
	baseMessage
	Subnets []subnets.SubnetJSON `json:"subnets"`
}

func (ipam *IPAMServer) handleSomeSubnets(conn *websocket.Conn, decJSON *json.Decoder) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	inMsg := inboundSomeSubnets{}
	err := decJSON.Decode(&inMsg)
	if err != nil {
		log.Printf("error decoding incoming message from (%v)\n", remoteIP)
		return
	}
	inMsg.Filter = strings.TrimSpace(inMsg.Filter)
	inMsg.Filter = strings.ToLower(inMsg.Filter)
	if inMsg.Filter == "" {
		log.Printf("(%v) has sent an empty search query\n", remoteIP)
		return
	}
	log.Printf("(%v) has requested someSubnets matching '%v'\n", remoteIP, inMsg.Filter)
	outMsg := outboundSomeSubnets{}
	outMsg.MessageType = SomeSubnets
	outMsg.SessionGUID = inMsg.SessionGUID
	timeoutChan := make(chan struct{}, 0)
	go func() {
		time.Sleep(5 * time.Second)
		close(timeoutChan)
	}()
	outMsg.Subnets = ipam.searchSubnetData(inMsg.Filter, timeoutChan)
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type inboundSpecificHosts struct {
	baseMessage
	Network string `json:"network"`
}

// HostData is structured data for client side use
type HostData struct {
	Addresses    []string   `json:"addresses"`
	Arecords     []string   `json:"aRecords"`
	LastAttempts []string   `json:"lastAttempts"`
	PingResults  []string   `json:"pingResults"`
	CustomData   [][]string `json:"customData"`
}

type outboundSpecificHosts struct {
	baseMessage
	Hosts HostData `json:"hosts"`
}

func (ipam *IPAMServer) handleSpecificHosts(conn *websocket.Conn, decJSON *json.Decoder) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	inMsg := inboundSpecificHosts{}
	err := decJSON.Decode(&inMsg)
	if err != nil {
		log.Printf("error decoding specificHosts request from (%v)\n", remoteIP)
		return
	}
	network := subnetmath.ParseNetworkCIDR(inMsg.Network)
	if network == nil {
		log.Printf("received an invalid specificHosts query '%v' from (%v)\n", inMsg.Network, remoteIP)
		return
	}
	log.Printf("(%v) has requested specificHosts for '%v'\n", remoteIP, network.String())
	sliceOfAddresses := []string{}
	currentIP := subnetmath.DuplicateAddr(network.IP)
	for network.Contains(currentIP) {
		sliceOfAddresses = append(sliceOfAddresses, currentIP.String())
		currentIP = subnetmath.NextAddr(currentIP)
	}
	outMsg := outboundSpecificHosts{}
	outMsg.MessageType = SpecificHosts
	outMsg.SessionGUID = inMsg.SessionGUID
	outMsg.Hosts = HostData{
		Addresses:    sliceOfAddresses,
		Arecords:     ipam.dns.GetFirstHostnameForAddresses(sliceOfAddresses),
		LastAttempts: ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses),
		PingResults:  ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses),
		CustomData:   ipam.custom.GetCustomData(sliceOfAddresses),
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type inboundSomeHosts struct {
	baseMessage
	Filter string `json:"filter"`
}

type outboundSomeHosts struct {
	baseMessage
	Hosts HostData `json:"hosts"`
}

func (ipam *IPAMServer) handleSomeHosts(conn *websocket.Conn, decJSON *json.Decoder) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	inMsg := inboundSomeHosts{}
	err := decJSON.Decode(&inMsg)
	if err != nil {
		log.Printf("error decoding someHosts request from (%v)\n", remoteIP)
		return
	}
	inMsg.Filter = strings.TrimSpace(inMsg.Filter)
	inMsg.Filter = strings.ToLower(inMsg.Filter)
	if inMsg.Filter == "" {
		log.Printf("(%v) has sent an empty search query\n", remoteIP)
		return
	}
	log.Printf("(%v) has requested someHosts matching '%v'\n", remoteIP, inMsg.Filter)
	outMsg := outboundSomeHosts{}
	outMsg.MessageType = SomeHosts
	outMsg.SessionGUID = inMsg.SessionGUID
	timeoutChan := make(chan struct{}, 0)
	go func() {
		time.Sleep(5 * time.Second)
		close(timeoutChan)
	}()
	outMsg.Hosts = ipam.searchHostData(inMsg.Filter, timeoutChan)
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding someHosts to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type outboundHistory struct {
	baseMessage
	History []string `json:"history"`
}

func (ipam *IPAMServer) handleHistory(conn *websocket.Conn, guid string) {
	outMsg := outboundHistory{}
	outMsg.MessageType = History
	outMsg.SessionGUID = guid
	outMsg.History = ipam.history.GetAllUserActions()
	if len(outMsg.History) > 10000 {
		outMsg.History = outMsg.History[:10000]
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
		log.Printf("error encoding history for (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type outboundDebugLog struct {
	baseMessage
	DebugLog []string `json:"debugLog"`
}

func (ipam *IPAMServer) handleDebugLog(conn *websocket.Conn, guid string) {
	outMsg := outboundDebugLog{}
	outMsg.MessageType = DebugLog
	outMsg.SessionGUID = guid
	outMsg.DebugLog = strings.Split(ipam.debug.GetString(), "\n")
	b, err := json.Marshal(outMsg)
	if err != nil {
		remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
		log.Printf("error encoding debugLog for (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type inboundManualPingScan struct {
	baseMessage
	Network string `json:"network"`
}

type outboundManualPingScan struct {
	baseMessage
	Results []ping.ScanResult `json:"results"`
}

func (ipam *IPAMServer) handleManualPingScan(conn *websocket.Conn, decJSON *json.Decoder) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	inMsg := inboundManualPingScan{}
	err := decJSON.Decode(&inMsg)
	if err != nil {
		log.Printf("error decoding manualPingScan request from (%v)\n", remoteIP)
		return
	}
	network := subnetmath.ParseNetworkCIDR(inMsg.Network)
	if network == nil {
		log.Printf("received an invalid manualPingScan query '%v' from (%v)\n", inMsg.Network, remoteIP)
		return
	}
	ipam.pinger.MarkHostsAsPending(network)
	ipam.semaphore <- struct{}{}
	go func() {
		if !ipam.demoModeBool {
			ipam.pinger.ScanNetwork(network)
		} else {
			ipam.pinger.ScanPretendNetwork(network)
		}
		<-ipam.semaphore
	}()
	outMsg := outboundManualPingScan{}
	outMsg.MessageType = ManualPingScan
	outMsg.SessionGUID = inMsg.SessionGUID
	outMsg.Results = ipam.pinger.GetScanResults(network)
	b, err := json.Marshal(outMsg)
	if err != nil {
		remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
		log.Printf("error encoding ManualPingScan for (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type inboundCreateSubnet struct {
	baseMessage
	SubnetRequest struct {
		User  string `json:"user"`
		Pass  string `json:"pass"`
		Net   string `json:"net"`
		Desc  string `json:"desc"`
		Notes string `json:"notes"`
		Vlan  string `json:"vlan"`
	} `json:"subnetRequest"`
}

func (ipam *IPAMServer) handleCreateSubnet(conn *websocket.Conn, decJSON *json.Decoder) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	inMsg := inboundCreateSubnet{}
	err := decJSON.Decode(&inMsg)
	if err != nil {
		log.Printf("error decoding inboundCreateSubnet request from (%v)\n", remoteIP)
		return
	}
	user := strings.TrimSpace(inMsg.SubnetRequest.User)
	pass := strings.TrimSpace(inMsg.SubnetRequest.Pass)
	mod := time.Now().Format(defaultTimeLayout)
	network := subnetmath.ParseNetworkCIDR(strings.TrimSpace(inMsg.SubnetRequest.Net))
	if network == nil {
		s := fmt.Sprintf("could not modify '%v' as it is not a valid CIDR subnet", inMsg.SubnetRequest.Net)
		sendGenericError(conn, s, inMsg.SessionGUID, int(InvalidSubnet))
		return
	}
	subnet := network.String()
	ipam.authCallbackMtx.RLock()
	if ipam.authCallback(user, pass) == false {
		s := fmt.Sprintf("could not create '%v' because of auth failure", subnet)
		sendGenericError(conn, s, inMsg.SessionGUID, int(AuthenticationFailure))
		return
	}
	ipam.authCallbackMtx.RUnlock()
	if user != "" {
		user = fmt.Sprintf("%v@%v", user, remoteIP)
	} else {
		user = remoteIP
	}
	desc := strings.TrimSpace(inMsg.SubnetRequest.Desc)
	details := strings.TrimSpace(inMsg.SubnetRequest.Notes)
	vlan := strings.TrimSpace(inMsg.SubnetRequest.Vlan)
	newSkeleton := &subnets.SubnetSkeleton{Net: subnet, Desc: desc, Details: details, Vlan: vlan, Mod: mod}
	err = ipam.subnets.CreateSubnet(newSkeleton)
	if err != nil {
		sendGenericError(conn, err.Error(), inMsg.SessionGUID, int(UnknownFault))
		return
	}
	msg := ipam.history.RecordUserAction(user, "creating subnet", newSkeleton.ToSlice())
	ipam.signalMutation(msg)
	sendGenericInfo(conn, "success", inMsg.SessionGUID)
}

type inboundModifySubnet inboundCreateSubnet

func (ipam *IPAMServer) handleModifySubnet(conn *websocket.Conn, decJSON *json.Decoder) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	inMsg := inboundModifySubnet{}
	err := decJSON.Decode(&inMsg)
	if err != nil {
		log.Printf("error decoding inboundModifySubnet request from (%v)\n", remoteIP)
		return
	}
	user := strings.TrimSpace(inMsg.SubnetRequest.User)
	pass := strings.TrimSpace(inMsg.SubnetRequest.Pass)
	mod := time.Now().Format(defaultTimeLayout)
	network := subnetmath.ParseNetworkCIDR(strings.TrimSpace(inMsg.SubnetRequest.Net))
	if network == nil {
		s := fmt.Sprintf("could not modify '%v' as it is not a valid CIDR subnet", inMsg.SubnetRequest.Net)
		sendGenericError(conn, s, inMsg.SessionGUID, int(InvalidSubnet))
		return
	}
	subnet := network.String()
	ipam.authCallbackMtx.RLock()
	if ipam.authCallback(user, pass) == false {
		s := fmt.Sprintf("could not modify '%v' because of auth failure", subnet)
		sendGenericError(conn, s, inMsg.SessionGUID, int(AuthenticationFailure))
		return
	}
	ipam.authCallbackMtx.RUnlock()
	if user != "" {
		user = fmt.Sprintf("%v@%v", user, remoteIP)
	} else {
		user = remoteIP
	}
	desc := strings.TrimSpace(inMsg.SubnetRequest.Desc)
	details := strings.TrimSpace(inMsg.SubnetRequest.Notes)
	vlan := strings.TrimSpace(inMsg.SubnetRequest.Vlan)
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	if oldSkeleton == nil {
		s := fmt.Sprintf("could not modify '%v' as it does not exist", subnet)
		sendGenericError(conn, s, inMsg.SessionGUID, int(DoesNotExist))
		return
	}
	newSkeleton := &subnets.SubnetSkeleton{Net: subnet, Desc: desc, Details: details, Vlan: vlan, Mod: mod}
	differences := oldSkeleton.ListDifferences(newSkeleton)
	if differences == nil {
		s := fmt.Sprintf("could not modify '%v' because there were no changes", subnet)
		sendGenericError(conn, s, inMsg.SessionGUID, int(AlreadyExists))
		return
	}
	err = ipam.subnets.ReplaceSubnet(newSkeleton)
	if err != nil {
		sendGenericError(conn, err.Error(), inMsg.SessionGUID, int(UnknownFault))
		return
	}
	msg := ipam.history.RecordUserAction(user, "pushing changes", differences)
	ipam.signalMutation(msg)
	sendGenericInfo(conn, "success", inMsg.SessionGUID)
}

type inboundDeleteSubnet inboundCreateSubnet

func (ipam *IPAMServer) handleDeleteSubnet(conn *websocket.Conn, decJSON *json.Decoder) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	inMsg := inboundDeleteSubnet{}
	err := decJSON.Decode(&inMsg)
	if err != nil {
		log.Printf("error decoding inboundDeleteSubnet request from (%v)\n", remoteIP)
		return
	}
	network := subnetmath.ParseNetworkCIDR(strings.TrimSpace(inMsg.SubnetRequest.Net))
	if network == nil {
		s := fmt.Sprintf("could not delete '%v' as it is not a valid CIDR subnet", inMsg.SubnetRequest.Net)
		sendGenericError(conn, s, inMsg.SessionGUID, int(InvalidSubnet))
		return
	}
	subnet := network.String()
	ipam.authCallbackMtx.RLock()
	user := strings.TrimSpace(inMsg.SubnetRequest.User)
	pass := strings.TrimSpace(inMsg.SubnetRequest.Pass)
	if ipam.authCallback(user, pass) == false {
		s := fmt.Sprintf("could not modify '%v' because of auth failure", subnet)
		sendGenericError(conn, s, inMsg.SessionGUID, int(AuthenticationFailure))
		return
	}
	if user != "" {
		user = fmt.Sprintf("%v@%v", user, remoteIP)
	} else {
		user = remoteIP
	}
	ipam.authCallbackMtx.RUnlock()
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	if oldSkeleton == nil || ipam.subnets.DeleteSubnet(network) != nil {
		s := fmt.Sprintf("could not delete '%v' as it does not exist", subnet)
		sendGenericError(conn, s, inMsg.SessionGUID, int(DoesNotExist))
		return
	}
	msg := ipam.history.RecordUserAction(user, "deleting subnet", oldSkeleton.ToSlice())
	ipam.signalMutation(msg)
	sendGenericInfo(conn, "success", inMsg.SessionGUID)
}
