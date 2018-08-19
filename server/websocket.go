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
			if err.Error() != "websocket: close 1001 (going away)" &&
				!strings.Contains(err.Error(), "connection reset by peer") {
				log.Printf("error receiving message from %v > %v\n", remoteIP, err)
			}
			return
		}
		if msgType != websocket.TextMessage {
			log.Printf("received an invalid message from %v\n", remoteIP)
			return
		}
		networkIn.Reset()
		networkIn.Write(newData)
		inMsg := simpleJSON{}
		err = decJSON.Decode(&inMsg)
		if err != nil {
			log.Printf("error decoding incoming message from %v\n", remoteIP)
			return
		}
		// send response to client
		switch inMsg.RequestType {
		case "GETSUBNETDATA":
			ipam.handleGetSubnetData(conn)
		case "GETHOSTDATA":
			ipam.handleGetHostData(conn, inMsg)
		case "GETCHANGEHISTORY":
			ipam.handleGetOverallHistory(conn)
		case "GETDEBUGINFO":
			ipam.handleGetDebugInfo(conn)
		case "POSTNEWSUBNET":
			ipam.handlePostNewSubnet(conn, inMsg)
		case "POSTMODIFYSUBNET":
			ipam.handlePostModifySubnet(conn, inMsg)
		case "POSTDELETESUBNET":
			ipam.handlePostDeleteSubnet(conn, inMsg)
		default:
			log.Printf("received invalid request from %v \n", remoteIP)
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
		log.Printf("error encoding outgoing error message to %v\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func removeWhitespace(stringSlice ...string) []string {
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
		log.Printf("error encoding outgoing message to %v\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type outgoingHostDataJSON struct {
	RequestType string     `json:"requestType"`
	RequestData [][]string `json:"requestData"`
}

func (ipam *IPAMServer) handleGetHostData(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	var network *net.IPNet
	if len(inMsg.RequestData) == 1 {
		network = subnetmath.BlindlyParseCIDR(inMsg.RequestData[0])
	}
	if network == nil {
		log.Printf("received an invalid request from %v\n", remoteIP)
		return
	}
	log.Printf("%v requested hostData for %v\n", remoteIP, network)
	addressCount := subnetmath.AddressCount(network)
	if addressCount >= 1024 {
		addressCount = 1023
	} else if addressCount > 2 {
		addressCount--
	}
	currentIP := subnetmath.DuplicateNetwork(network).IP
	sliceOfAddresses := make([]string, addressCount)
	for i := 0; i < addressCount; i++ {
		sliceOfAddresses[i] = currentIP.String()
		currentIP = subnetmath.AddToAddr(currentIP, 1)
	}
	outMsg := outgoingHostDataJSON{
		RequestType: "DISPLAYHOSTDATA",
		RequestData: [][]string{
			sliceOfAddresses,
			ipam.dns.GetForwardRecordsForAddresses(sliceOfAddresses),
			ipam.pinger.GetPingResultsForAddresses(sliceOfAddresses),
			ipam.pinger.GetPingTimesForAddresses(sliceOfAddresses),
		},
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to %v\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (ipam *IPAMServer) handleGetOverallHistory(conn *websocket.Conn) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	log.Printf("%v requesting history\n", remoteIP)
	outMsg := simpleJSON{
		RequestType: "DISPLAYHISTORYDATA",
		RequestData: ipam.history.GetAllUserActions(),
	}
	if len(outMsg.RequestData) > 10000 {
		outMsg.RequestData = outMsg.RequestData[:10000]
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to %v\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (ipam *IPAMServer) handleGetDebugInfo(conn *websocket.Conn) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	log.Printf("%v requesting debugInfo\n", remoteIP)
	outMsg := simpleJSON{
		RequestType: "DISPLAYDEBUGDATA",
		RequestData: strings.Split(ipam.debug.GetString(), "\n"),
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to %v\n", remoteIP)
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (ipam *IPAMServer) handlePostNewSubnet(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 4 {
		log.Printf("received an invalid request from %v\n", remoteIP)
		return
	}
	inMsg.RequestData = removeWhitespace(inMsg.RequestData...)
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
		Mod:     time.Now().Format(defaultTimeLayout),
		Vlan:    inMsg.RequestData[2],
		Details: inMsg.RequestData[3],
	}
	err = ipam.subnets.CreateSubnet(newSkeleton)
	if err != nil {
		sendErrorMessage(conn, err.Error())
		return
	}
	ipam.history.RecordUserAction(remoteIP, "created", newSkeleton.ToSlice())
	ipam.signalMutation()
	ipam.handleGetSubnetData(conn)
}

func (ipam *IPAMServer) handlePostModifySubnet(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 4 {
		log.Printf("received an invalid request from %v\n", remoteIP)
		return
	}
	inMsg.RequestData = removeWhitespace(inMsg.RequestData...)
	network := subnetmath.BlindlyParseCIDR(inMsg.RequestData[0])
	if network == nil {
		log.Printf("received an invalid request from %v\n", remoteIP)
		return
	}
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	newSkeleton := &subnets.SubnetSkeleton{
		Net:     inMsg.RequestData[0],
		Desc:    inMsg.RequestData[1],
		Vlan:    inMsg.RequestData[2],
		Details: inMsg.RequestData[3],
	}
	differences := oldSkeleton.ListDifferences(newSkeleton)
	if len(differences) == 1 {
		log.Printf("received an invalid request from %v\n", remoteIP)
		sendErrorMessage(conn,
			fmt.Sprintf("could not modify '%v' because there were no changes", network))
		return
	}
	err := ipam.subnets.ReplaceSubnet(newSkeleton)
	if err != nil {
		sendErrorMessage(conn, err.Error())
	}
	ipam.history.RecordUserAction(remoteIP, "modified", differences)
	ipam.signalMutation()
	ipam.handleGetSubnetData(conn)
}

func (ipam *IPAMServer) handlePostDeleteSubnet(conn *websocket.Conn, inMsg simpleJSON) {
	remoteIP, _, _ := net.SplitHostPort(conn.RemoteAddr().String())
	if len(inMsg.RequestData) != 1 {
		log.Printf("received an invalid request from %v\n", remoteIP)
		return
	}
	inMsg.RequestData = removeWhitespace(inMsg.RequestData...)
	network := subnetmath.BlindlyParseCIDR(inMsg.RequestData[0])
	oldSkeleton := ipam.subnets.GetSubnetSkeleton(network)
	if network == nil || ipam.subnets.DeleteSubnet(network) != nil {
		sendErrorMessage(conn, fmt.Sprintf("could not delete '%v' as it does not exist", inMsg.RequestData[0]))
		return
	}
	ipam.history.RecordUserAction(remoteIP, "deleted", oldSkeleton.ToSlice())
	ipam.signalMutation()
	ipam.handleGetSubnetData(conn)
}
