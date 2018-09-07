package server

import (
	"log"
	"net/http"
	"net/http/pprof"
	"sync"
	"time"

	"github.com/demskie/ipam/server/custom"
	"github.com/demskie/ipam/server/dns"
	"github.com/demskie/ipam/server/history"
	"github.com/demskie/ipam/server/ping"
	"github.com/demskie/ipam/server/subnets"

	"github.com/demskie/randutil"

	"github.com/gorilla/mux"
)

const (
	defaultTimeLayout = "01-02-2006 15:04:05"
)

// IPAMServer is the object used to mutate and read data
type IPAMServer struct {
	mutationMtx  *sync.Mutex
	mutationChan chan MutatedData
	subnets      *subnets.Tree
	history      *history.UserActions
	debug        *history.ServerLogger
	dns          *dns.Bucket
	pinger       *ping.Pinger
	custom       *custom.Datastore
	semaphore    chan struct{}
}

// MutatedData contains the raw lines of the changed subnets.csv and history.txt files
type MutatedData struct {
	CommitMsg string
	Subnets   []string
	History   []string
}

// NewIPAMServer returns a new server object
func NewIPAMServer() *IPAMServer {
	return &IPAMServer{
		mutationMtx:  &sync.Mutex{},
		mutationChan: nil,
		subnets:      subnets.NewTree(),
		history:      history.NewUserActions(),
		debug:        history.NewServerLogger(),
		dns:          dns.NewBucket(),
		pinger:       ping.NewPinger(),
		custom:       custom.NewDatastore(),
		semaphore:    make(chan struct{}, 10000),
	}
}

func (ipam *IPAMServer) signalMutation(reason string) {
	ipam.mutationChan <- MutatedData{
		CommitMsg: reason,
		Subnets:   ipam.ExportSubnetCSVLines(),
		History:   ipam.history.GetAllUserActions(),
	}
}

// PingSweepSubnets will pick subnets at random and ping all nonBroadcast addresses
func (ipam *IPAMServer) PingSweepSubnets(pingsPerSecond, pingerGoroutineCount int) {
	go ipam.pinger.InitializeBackgroundPinger(pingsPerSecond, pingerGoroutineCount)
	rnum := randutil.CreateBasicMathRnum()
	for {
		subnet := ipam.subnets.GetRandomNetwork(rnum)
		if subnet != nil {
			ipam.pinger.ScanNetwork(subnet)
		}
	}
}

// ServeAndReceiveChan will start the HTTP Webserver and stream results back to the caller
func (ipam *IPAMServer) ServeAndReceiveChan(addr string, directory string, debug bool) chan MutatedData {
	if ipam.mutationChan != nil {
		return ipam.mutationChan
	}
	ipam.mutationMtx.Lock()
	defer ipam.mutationMtx.Unlock()
	ipam.mutationChan = make(chan MutatedData, 1)
	go func() {
		go startDebugServer(debug)
		ipam.startWebServer(addr, directory)
		close(ipam.mutationChan)
	}()
	return ipam.mutationChan
}

func startDebugServer(debug bool) {
	if debug {
		profmux := http.NewServeMux()
		profmux.HandleFunc("/debug/pprof/", pprof.Index)
		profmux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
		profmux.HandleFunc("/debug/pprof/profile", pprof.Profile)
		profmux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
		profmux.HandleFunc("/debug/pprof/trace", pprof.Trace)
		profmux.Handle("/debug/pprof/block", pprof.Handler("block"))
		profmux.Handle("/debug/pprof/goroutine", pprof.Handler("goroutine"))
		profmux.Handle("/debug/pprof/heap", pprof.Handler("heap"))
		profmux.Handle("/debug/pprof/threadcreate", pprof.Handler("threadcreate"))
		profmux.Handle("/debug/pprof/mutex", pprof.Handler("mutex"))
		srvProf := &http.Server{
			Addr:    ":8080",
			Handler: profmux,
		}
		errServeInsecure := srvProf.ListenAndServe()
		log.Println("DebugListenAndServe:", errServeInsecure)
	}
}

func (ipam *IPAMServer) startWebServer(addr, directory string) {
	muxInsecure := mux.NewRouter()
	muxInsecure.HandleFunc("/sync", ipam.handleWebsocketClient)
	muxInsecure.HandleFunc("/api/subnets", ipam.handleRestfulSubnets)
	muxInsecure.HandleFunc("/api/hosts", ipam.handleRestfulHosts)
	muxInsecure.HandleFunc("/api/history", ipam.handleRestfulHistory)
	muxInsecure.HandleFunc("/api/createsubnet", ipam.handleRestfulCreateSubnet)
	muxInsecure.HandleFunc("/api/replacesubnet", ipam.handleRestfulReplaceSubnet)
	muxInsecure.HandleFunc("/api/deletesubnet", ipam.handleRestfulDeleteSubnet)
	var fs http.Dir
	if directory == "" {
		fs = http.Dir(".")
	} else {
		fs = http.Dir(directory)
	}
	muxInsecure.PathPrefix("/").Handler(http.FileServer(fs))
	srvInsecure := &http.Server{
		Addr:         addr,
		Handler:      muxInsecure,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	errServeInsecure := srvInsecure.ListenAndServe()
	log.Fatal("ListenAndServe:", errServeInsecure)
}
