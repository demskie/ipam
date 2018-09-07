package main

import (
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/demskie/ipam/server"
)

const (
	pingsPerSecond = 128
	goroutineCount = 256
)

func main() {
	// create a new server object
	ipam := server.NewIPAMServer()
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatalf("unable to get current working directory > %v\n", err)
	}

	// import the subnets.csv file
	subnetsFilePath := filepath.Join(cwd, "subnets.csv")
	subnetsBytes, err := ioutil.ReadFile(subnetsFilePath)
	if err != nil {
		log.Fatalf("unable to read subnets.csv > %v\n", err)
	}
	ipam.IngestSubnetCSVLines(strings.Split(string(subnetsBytes), "\n"))

	// import the history.txt file
	historyFilePath := filepath.Join(cwd, "history.txt")
	historyBytes, err := ioutil.ReadFile(historyFilePath)
	if err != nil {
		log.Fatalf("unable to read history.txt > %v\n", err)
	}
	ipam.IngestUserHistory(strings.Split(string(historyBytes), "\n"))

	// start pinging hosts in the background
	go ipam.PingSweepSubnets(pingsPerSecond, goroutineCount)

	// on every user action receive a new string slice that has all subnets and history so far
	for mutatedData := range ipam.ServeAndReceiveChan(":80", "client/build/", true) {
		// overwrite existing subnets.csv
		subnetsBytes = []byte(strings.Join(mutatedData.Subnets, ""))
		err = ioutil.WriteFile(subnetsFilePath, subnetsBytes, 0644)
		// overwrite existing history.txt
		historyBytes = []byte(strings.Join(mutatedData.History, ""))
		err = ioutil.WriteFile(historyFilePath, historyBytes, 0644)
	}
}
