package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
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
			if err.Error() != "websocket: close 1001 (going away)" {
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

type outgoingSubnetDataJSON struct {
	RequestType string               `json:"requestType"`
	RequestData []subnets.SubnetJSON `json:"requestData"`
}

func (ipam *IPAMServer) handleGetSubnetData(conn *websocket.Conn) {
	outMsg := outgoingSubnetDataJSON{
		RequestType: "DISPLAYSUBNETDATA",
		RequestData: ipam.subnets.GetJSON(),
	}
	b, err := json.Marshal(outMsg)
	if err != nil {
		log.Printf("error encoding outgoing message to %v", conn.RemoteAddr())
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

type outgoingHostDataJSON struct {
	RequestType string     `json:"requestType"`
	RequestData [][]string `json:"requestData"`
}

func (ipam *IPAMServer) handleGetHostData(conn *websocket.Conn, inMsg simpleJSON) {
	var network *net.IPNet
	if len(inMsg.RequestData) == 1 {
		network = subnetmath.BlindlyParseCIDR(inMsg.RequestData[0])
	}
	if network == nil {
		log.Printf("received invalid request from %v > %#v\n", conn.RemoteAddr(), inMsg)
		return
	}
	log.Printf("%v requesting hostData for %v\n", conn.RemoteAddr(), network)
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
		log.Printf("error encoding outgoing message to %v", conn.RemoteAddr())
	} else {
		conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (ipam *IPAMServer) handleGetOverallHistory(conn *websocket.Conn) {

}

func (ipam *IPAMServer) handleGetDebugInfo(conn *websocket.Conn) {

}

func (ipam *IPAMServer) handlePostNewSubnet(conn *websocket.Conn, inMsg simpleJSON) {
	err := ipam.subnets.CreateSubnet(&subnets.SubnetSkeleton{
		Net:     inMsg.RequestData[0],
		Desc:    inMsg.RequestData[1],
		Mod:     time.Now().Format(defaultTimeLayout),
		Vlan:    inMsg.RequestData[3],
		Details: inMsg.RequestData[4],
	})
	if err != nil {
		outMsg := simpleJSON{
			RequestType: "DISPLAYERROR",
			RequestData: []string{err.Error()},
		}
		b, err := json.Marshal(outMsg)
		if err != nil {
			log.Printf("error encoding outgoing message to %v", conn.RemoteAddr())
		} else {
			conn.WriteMessage(websocket.TextMessage, b)
			ipam.handleGetSubnetData(conn)
		}
	}
}

func (ipam *IPAMServer) handlePostModifySubnet(conn *websocket.Conn, inMsg simpleJSON) {
	err := ipam.subnets.ReplaceSubnet(&subnets.SubnetSkeleton{
		Net:     inMsg.RequestData[0],
		Desc:    inMsg.RequestData[1],
		Vlan:    inMsg.RequestData[3],
		Details: inMsg.RequestData[4],
	})
	if err != nil {
		outMsg := simpleJSON{
			RequestType: "DISPLAYERROR",
			RequestData: []string{err.Error()},
		}
		b, err := json.Marshal(outMsg)
		if err != nil {
			log.Printf("error encoding outgoing message to %v", conn.RemoteAddr())
		} else {
			conn.WriteMessage(websocket.TextMessage, b)
			ipam.handleGetSubnetData(conn)
		}
	}
}

func (ipam *IPAMServer) handlePostDeleteSubnet(conn *websocket.Conn, inMsg simpleJSON) {
	network := subnetmath.BlindlyParseCIDR(inMsg.RequestData[0])
	if network == nil || ipam.subnets.DeleteSubnet(network) != nil {
		outMsg := simpleJSON{
			RequestType: "DISPLAYERROR",
			RequestData: []string{fmt.Sprintf("could not delete '%v' as it does not exist", inMsg.RequestData[0])},
		}
		b, err := json.Marshal(outMsg)
		if err != nil {
			log.Printf("error encoding outgoing message to %v", conn.RemoteAddr())
		} else {
			conn.WriteMessage(websocket.TextMessage, b)
			ipam.handleGetSubnetData(conn)
		}
	}
}
