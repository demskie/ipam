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

	"github.com/demskie/ipam/server/ping"

	"github.com/demskie/ipam/server/subnets"
	"github.com/demskie/subnetmath"
	"github.com/gorilla/websocket"
)

type simpleJSON struct {
	RequestType string   `json:"requestType"`
	RequestData []string `json:"requestData"`
}

func (ipam *IPAMServer) handleWebsocketClient(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		HandshakeTimeout:  30 * time.Second,
		ReadBufferSize:    1024,
		WriteBufferSize:   1024,
		EnableCompression: true,
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
		inMsg := simpleJSON{}
		err = decJSON.Decode(&inMsg)
		if err != nil {
			log.Printf("error decoding incoming message from (%v)\n", remoteIP)
			return
		}
		// send response to client
		switch inMsg.RequestType {
		case "GETSUBNETDATA":
			ipam.handleGetSubnetData(conn)
		case "GETHOSTDATA":
			ipam.handleGetHostData(conn, inMsg)
		case "GETHISTORYDATA":
			ipam.handleGetHistoryData(conn)
		case "GETDEBUGDATA":
			ipam.handleGetDebugData(conn)
		case "GETSCANSTART":
			ipam.handleGetScanStart(conn, inMsg)
		case "GETSCANDATA":
			ipam.handleGetScanData(conn, inMsg)
		case "GETSEARCHDATA":
			ipam.handleGetSearchData(conn, inMsg)
		case "POSTNEWSUBNET":
			ipam.handlePostNewSubnet(conn, inMsg)
		case "POSTMODIFYSUBNET":
			ipam.handlePostModifySubnet(conn, inMsg)
		case "POSTDELETESUBNET":
			ipam.handlePostDeleteSubnet(conn, inMsg)
		default:
			log.Printf("received unknown request from (%v)\n", remoteIP)
		}
	}
}

func sendErrorMessage(conn *websocket.Conn, message string) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	outMsg := simpleJSON{
		RequestType: "DISPLAYERROR",
		RequestData: []string{message},
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing error message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func removeWhitespace(stringSlice []string) []string {
	results := make([]string, 0, len(stringSlice))
	for _, s := range stringSlice {
		results = append(results, strings.TrimSpace(s))
	}
	return results
}

type outgoingSubnetDataJSON struct {
	RequestType string               `json:"requestType"`
	RequestData []subnets.SubnetJSON `json:"requestData"`
}

func (ipam *IPAMServer) handleGetSubnetData(conn *websocket.Conn) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	outMsg := outgoingSubnetDataJSON{
		RequestType: "DISPLAYSUBNETDATA",
		RequestData: ipam.subnets.GetJSON(),
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type nestedStringsJSON struct {
	RequestType string     `json:"requestType"`
	RequestData [][]string `json:"requestData"`
}

func (ipam *IPAMServer) handleGetHostData(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	var network *net.IPNet
	if len(inMsg.RequestData) == 1 {
		network = subnetmath.ParseNetworkCIDR(inMsg.RequestData[0])
	}
	if network == nil {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	log.Printf("(%v) has requested hostData for %v\n", remoteIP, network)
	addressCount := ping.GetNumberOfHosts(network)
	currentIP := subnetmath.DuplicateNetwork(network).IP
	sliceOfAddresses := make([]string, addressCount)
	for i := 0; i < addressCount; i++ {
		sliceOfAddresses[i] = currentIP.String()
		currentIP = subnetmath.AddToAddr(currentIP, 1)
	}
	outMsg := nestedStringsJSON{
		RequestType: "DISPLAYHOSTDATA",
		RequestData: [][]string{
			sliceOfAddresses,
			ipam.dns.GetFirstHostnameForAddresses(sliceOfAddresses),
			ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses),
			ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses),
		},
	}
	outMsg.RequestData = ipam.custom.AppendCustomData(outMsg.RequestData)
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (ipam *IPAMServer) handleGetHistoryData(conn *websocket.Conn) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	log.Printf("(%v) has requested historyData\n", remoteIP)
	outMsg := simpleJSON{
		RequestType: "DISPLAYHISTORYDATA",
		RequestData: ipam.history.GetAllUserActions(),
	}
	if len(outMsg.RequestData) > 10000 {
		outMsg.RequestData = outMsg.RequestData[:10000]
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (ipam *IPAMServer) handleGetDebugData(conn *websocket.Conn) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	log.Printf("(%v) has requested debugData\n", remoteIP)
	outMsg := simpleJSON{
		RequestType: "DISPLAYDEBUGDATA",
		RequestData: strings.Split(ipam.debug.GetString(), "\n"),
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func sendScanResults(ipam *IPAMServer, conn *websocket.Conn, network *net.IPNet, remoteIP string) {
	outMsg := nestedStringsJSON{
		RequestType: "DISPLAYSCANDATA",
		RequestData: ipam.pinger.GetScanResults(network),
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (ipam *IPAMServer) handleGetScanStart(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 1 {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	inMsg.RequestData = removeWhitespace(inMsg.RequestData)
	addr, network, err := net.ParseCIDR(inMsg.RequestData[0])
	if err != nil {
		sendErrorMessage(conn, fmt.Sprintf("could not scan '%v' as it is not a valid CIDR subnet", inMsg.RequestData[0]))
		return
	} else if addr.Equal(network.IP) == false {
		sendErrorMessage(conn, fmt.Sprintf("could not scan '%v' because it is host address (network address: '%v')", inMsg.RequestData[0], network))
		return
	}
	ipam.pinger.MarkHostsAsPending(network)
	ipam.semaphore <- struct{}{}
	go func() {
		ipam.pinger.ScanNetwork(network)
		<-ipam.semaphore
	}()
	sendScanResults(ipam, conn, network, remoteIP)
}

func (ipam *IPAMServer) handleGetScanData(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 1 {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	inMsg.RequestData = removeWhitespace(inMsg.RequestData)
	addr, network, err := net.ParseCIDR(inMsg.RequestData[0])
	if err != nil {
		sendErrorMessage(conn, fmt.Sprintf("could not scan '%v' as it is not a valid CIDR subnet", inMsg.RequestData[0]))
		return
	} else if addr.Equal(network.IP) == false {
		sendErrorMessage(conn, fmt.Sprintf("could not scan '%v' because it is host address (network address: '%v')", inMsg.RequestData[0], network))
		return
	}
	sendScanResults(ipam, conn, network, remoteIP)
}

type searchRequestJSON struct {
	RequestType string `json:"requestType"`
	RequestData struct {
		SearchTarget string               `json:"searchTarget"`
		SubnetData   []subnets.SubnetJSON `json:"subnetData"`
		HostData     [][]string           `json:"hostData"`
	} `json:"requestData"`
}

func (ipam *IPAMServer) handleGetSearchData(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 1 {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	originalRequest := inMsg.RequestData[0]
	inMsg.RequestData[0] = strings.TrimSpace(inMsg.RequestData[0])
	inMsg.RequestData[0] = strings.ToLower(inMsg.RequestData[0])
	if inMsg.RequestData[0] == "" {
		log.Printf("(%v) has requested cancellation on the last search query\n", remoteIP)
		return
	}
	log.Printf("(%v) has requested searchData for '%v'\n", remoteIP, inMsg.RequestData[0])
	if inMsg.RequestData[0] == "" {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	timeoutChan := make(chan struct{}, 0)
	go func() {
		time.Sleep(5 * time.Second)
		close(timeoutChan)
	}()
	outMsg := searchRequestJSON{}
	outMsg.RequestType = "DISPLAYSEARCHDATA"
	outMsg.RequestData.SearchTarget = originalRequest
	outMsg.RequestData.SubnetData = ipam.searchSubnetData(inMsg.RequestData[0], timeoutChan)
	outMsg.RequestData.HostData = ipam.searchHostData(inMsg.RequestData[0], timeoutChan)
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to (%v)\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (ipam *IPAMServer) handlePostNewSubnet(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 4 {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	inMsg.RequestData = removeWhitespace(inMsg.RequestData)
	addr, network, err := net.ParseCIDR(inMsg.RequestData[0])
	if err != nil {
		sendErrorMessage(conn, fmt.Sprintf("could not create '%v' as it is not a valid CIDR subnet", inMsg.RequestData[0]))
		return
	} else if addr.Equal(network.IP) == false {
		sendErrorMessage(conn, fmt.Sprintf("could not create '%v' because it is host address (network address: '%v')", inMsg.RequestData[0], network))
		return
	}
	newSkeleton := &subnets.SubnetSkeleton{
		Net:     inMsg.RequestData[0],
		Desc:    inMsg.RequestData[1],
		Details: inMsg.RequestData[2],
		Vlan:    inMsg.RequestData[3],
		Mod:     time.Now().Format(defaultTimeLayout),
	}
	err = ipam.subnets.CreateSubnet(newSkeleton)
	if err != nil {
		sendErrorMessage(conn, err.Error())
		return
	}
	msg := ipam.history.RecordUserAction(remoteIP, "creating subnet", newSkeleton.ToSlice())
	ipam.signalMutation(msg)
	ipam.handleGetSubnetData(conn)
}

func (ipam *IPAMServer) handlePostModifySubnet(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 4 {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	inMsg.RequestData = removeWhitespace(inMsg.RequestData)
	network := subnetmath.ParseNetworkCIDR(inMsg.RequestData[0])
	if network == nil {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	newSkeleton := &subnets.SubnetSkeleton{
		Net:     inMsg.RequestData[0],
		Desc:    inMsg.RequestData[1],
		Details: inMsg.RequestData[2],
		Vlan:    inMsg.RequestData[3],
	}
	differences := oldSkeleton.ListDifferences(newSkeleton)
	if differences == nil {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		sendErrorMessage(conn,
			fmt.Sprintf("could not modify '%v' because there were no changes", network))
		return
	}
	err := ipam.subnets.ReplaceSubnet(newSkeleton)
	if err != nil {
		sendErrorMessage(conn, err.Error())
	}
	msg := ipam.history.RecordUserAction(remoteIP, "pushing changes", differences)
	ipam.signalMutation(msg)
	ipam.handleGetSubnetData(conn)
}

func (ipam *IPAMServer) handlePostDeleteSubnet(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 1 {
		log.Printf("received an invalid request from (%v)\n", remoteIP)
		return
	}
	inMsg.RequestData = removeWhitespace(inMsg.RequestData)
	network := subnetmath.ParseNetworkCIDR(inMsg.RequestData[0])
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	if network == nil || ipam.subnets.DeleteSubnet(network) != nil {
		sendErrorMessage(conn, fmt.Sprintf("could not delete '%v' as it does not exist", inMsg.RequestData[0]))
		return
	}
	msg := ipam.history.RecordUserAction(remoteIP, "deleting subnet", oldSkeleton.ToSlice())
	ipam.signalMutation(msg)
	ipam.handleGetSubnetData(conn)
}
