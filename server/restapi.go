package server

import "net/http"

// curl http://localhost/api/subnets | python -m json.tool

func (ipam *IPAMServer) handleRestfulSubnets(w http.ResponseWriter, r *http.Request) {

}

// curl --header "Content-Type: application/json" --request GET \
//		--data '{"subnet":"192.168.0.0/24"}' \
//		http://localhost/api/hosts | python -m json.tool

func (ipam *IPAMServer) handleRestfulHosts(w http.ResponseWriter, r *http.Request) {

}

// curl http://localhost/api/history | python -m json.tool

func (ipam *IPAMServer) handleRestfulHistory(w http.ResponseWriter, r *http.Request) {

}

// curl --header "Content-Type: application/json" --request POST \
//		--data '{"subnet":"192.168.0.0/24", "description":"this is a test"}' \
//		http://localhost/api/createsubnet

func (ipam *IPAMServer) handleRestfulCreateSubnet(w http.ResponseWriter, r *http.Request) {

}

// curl --header "Content-Type: application/json" --request POST \
//		--data '{"subnet":"192.168.0.0/24", "description":"overwrite the previous description"}' \
//		http://localhost/api/replacesubnet

func (ipam *IPAMServer) handleRestfulReplaceSubnet(w http.ResponseWriter, r *http.Request) {

}

// curl --header "Content-Type: application/json" --request POST \
//	 	--data '{"subnet":"192.168.0.0/24"}' \
//		http://localhost/api/deletesubnet

func (ipam *IPAMServer) handleRestfulDeleteSubnet(w http.ResponseWriter, r *http.Request) {

}
