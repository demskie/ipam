package server

import (
	"bytes"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

type incomingJSON struct {
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
		inMsg := incomingJSON{}
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
			log.Printf("received invalid request from %v > %+v\n", remoteIP, inMsg)
		}
	}
}

func (ipam *IPAMServer) handleGetSubnetData(conn *websocket.Conn) {

}

func (ipam *IPAMServer) handleGetHostData(conn *websocket.Conn, inMsg incomingJSON) {

}

func (ipam *IPAMServer) handleGetOverallHistory(conn *websocket.Conn) {

}

func (ipam *IPAMServer) handleGetDebugInfo(conn *websocket.Conn) {

}

func (ipam *IPAMServer) handlePostNewSubnet(conn *websocket.Conn, inMsg incomingJSON) {

}

func (ipam *IPAMServer) handleModifyNewSubnet(conn *websocket.Conn, inMsg incomingJSON) {

}

func (ipam *IPAMServer) handlePostDeleteSubnet(conn *websocket.Conn, inMsg incomingJSON) {

}
