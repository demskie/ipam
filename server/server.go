package server

import (
	"crypto/tls"
	"log"
	"net/http"
	"net/http/pprof"
	"path/filepath"
	"sync"
	"time"

	"github.com/davecgh/go-spew/spew"
	"github.com/demskie/archive"
	"github.com/demskie/ipam/server/custom"
	"github.com/demskie/ipam/server/dns"
	"github.com/demskie/ipam/server/history"
	"github.com/demskie/ipam/server/ping"
	"github.com/demskie/ipam/server/subnets"

	"github.com/demskie/randutil"

	"github.com/gorilla/mux"

	gsyslog "github.com/hashicorp/go-syslog"
)

const (
	defaultTimeLayout = "01-02-2006 15:04:05"
)

// IPAMServer is the object used to mutate and read data
type IPAMServer struct {
	mutationMtx     *sync.Mutex
	mutationChan    chan MutatedData
	demoModeBool    bool
	authCallbackMtx *sync.RWMutex
	authCallback    func(user, pass string) bool
	subnets         *subnets.Tree
	history         *history.UserActions
	debug           *history.ServerLogger
	dns             *dns.Bucket
	pinger          *ping.Pinger
	custom          *custom.Datastore
	httpRouter      *mux.Router
	semaphore       chan struct{}
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
		mutationMtx:     &sync.Mutex{},
		mutationChan:    nil,
		demoModeBool:    false,
		authCallbackMtx: &sync.RWMutex{},
		authCallback:    func(user, pass string) bool { return false },
		subnets:         subnets.NewTree(),
		history:         history.NewUserActions(),
		debug:           history.NewServerLogger(),
		dns:             dns.NewBucket(),
		pinger:          ping.NewPinger(),
		custom:          custom.NewDatastore(),
		httpRouter:      mux.NewRouter(),
		semaphore:       make(chan struct{}, 10000),
	}
}

func (ipam *IPAMServer) signalMutation(reason string) {
	ipam.mutationChan <- MutatedData{
		CommitMsg: reason,
		Subnets:   ipam.ExportSubnetCSVLines(),
		History:   ipam.history.GetAllUserActions(),
	}
}

// EnableDemoMode is used to fake ping results for demonstration purposes
func (ipam *IPAMServer) EnableDemoMode() {
	ipam.mutationMtx.Lock()
	defer ipam.mutationMtx.Unlock()
	ipam.demoModeBool = true
}

// SetAuthCallback is used to specify whether users are authenticated to make modifications
func (ipam *IPAMServer) SetAuthCallback(callback func(user, pass string) bool) {
	ipam.authCallbackMtx.Lock()
	defer ipam.authCallbackMtx.Unlock()
	ipam.authCallback = callback
}

// PingSweepSubnets will pick subnets at random and ping all nonBroadcast addresses
func (ipam *IPAMServer) PingSweepSubnets(pingsPerSecond, pingerGoroutineCount int) {
	go ipam.pinger.InitializeBackgroundPinger(pingsPerSecond, pingerGoroutineCount)
	rnum := randutil.CreateBasicMathRnum()
	for {
		subnet := ipam.subnets.GetRandomNetwork(rnum)
		if subnet != nil {
			if !ipam.demoModeBool {
				ipam.pinger.ScanNetwork(subnet)
			} else {
				ipam.pinger.ScanPretendNetwork(subnet)
			}
		}
		time.Sleep(128 * time.Millisecond)
	}
}

// AddSyslogServer is used for remote logging purposes
func (ipam *IPAMServer) AddSyslogServer(address, port string) error {
	wr, err := gsyslog.DialLogger("tcp", address+":"+port, gsyslog.LOG_INFO, "IPAM", "server")
	if err != nil {
		return err
	}
	ipam.debug.AddIOWriter(wr)
	return nil
}

// AttachCustomHandler is used to append custom handlers to the HTTP server
func (ipam *IPAMServer) AttachCustomHandler(path string, handler http.Handler) {
	ipam.mutationMtx.Lock()
	defer ipam.mutationMtx.Unlock()
	ipam.httpRouter.Handle(path, handler)
}

// AttachCustomHandlerFunc is used to append custom handlers to the HTTP server
func (ipam *IPAMServer) AttachCustomHandlerFunc(path string, handlerFunc func(w http.ResponseWriter, r *http.Request)) {
	ipam.mutationMtx.Lock()
	defer ipam.mutationMtx.Unlock()
	ipam.httpRouter.HandleFunc(path, handlerFunc)
}

// ServeAndReceiveChan will start the HTTP Webserver and stream results back to the caller
func (ipam *IPAMServer) ServeAndReceiveChan(directory, crtPath, keyPath string, debug bool) chan MutatedData {
	if ipam.mutationChan != nil {
		return ipam.mutationChan
	}
	ipam.mutationMtx.Lock()
	defer ipam.mutationMtx.Unlock()
	ipam.mutationChan = make(chan MutatedData, 1)
	go func() {
		ipam.startWebServer(debug, directory, crtPath, keyPath)
		close(ipam.mutationChan)
	}()
	return ipam.mutationChan
}

func (ipam *IPAMServer) startWebServer(debug bool, publicDir, crtPath, keyPath string) {
	// conditionally start debug server
	if debug {
		go startDebugServer()
	}

	// modify filepaths to match the environment's preferred filepath seperator
	publicDir = filepath.Clean(publicDir)

	// recurse through all static web content and create compressed copies
	fileList, err := archive.CompressWebserverFiles(publicDir)
	if err != nil {
		log.Printf("unable to compress static webserver files because: %v\n", err)
	}
	log.Println("compressed the following:", spew.Sdump(fileList))

	// conditionally start secure server
	if crtPath != "" && keyPath != "" {
		go startInsecureRedirectServer()
		startSecureServer(publicDir, crtPath, keyPath, ipam)
	} else {
		startInsecureServer(publicDir, ipam)
	}
}

func startDebugServer() {
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
	log.Printf("startDebugServer: %v\n", errServeInsecure)
}

func startSecureServer(publicDir, crtPath, keyPath string, ipam *IPAMServer) {
	publicDir = filepath.Clean(publicDir)
	crtPath = filepath.Clean(crtPath)
	keyPath = filepath.Clean(keyPath)
	ipam.mutationMtx.Lock()
	ipam.httpRouter.HandleFunc("/sync", ipam.handleWebsocketClient)
	ipam.httpRouter.PathPrefix("/").Handler(archive.FileServer(http.Dir(publicDir)))
	ipam.mutationMtx.Unlock()
	srvSecure := &http.Server{
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
		Addr:         ":443",
		Handler:      ipam.httpRouter,
		TLSConfig: &tls.Config{
			MinVersion:               tls.VersionTLS12,
			CurvePreferences:         []tls.CurveID{tls.CurveP521, tls.CurveP384, tls.CurveP256},
			PreferServerCipherSuites: true,
			CipherSuites:             nil, // use default
		},
		TLSNextProto: nil,
	}
	log.Fatal("startSecureServer: ", srvSecure.ListenAndServeTLS(crtPath, keyPath))
}

func startInsecureRedirectServer() {
	log.Fatal("startInsecureRedirectServer: ",
		http.ListenAndServe(":80", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Redirect(w, r, "https://"+r.Host+r.URL.String(), http.StatusMovedPermanently)
		})),
	)
}

func startInsecureServer(publicDir string, ipam *IPAMServer) {
	publicDir = filepath.Clean(publicDir)
	ipam.mutationMtx.Lock()
	ipam.httpRouter.HandleFunc("/sync", ipam.handleWebsocketClient)
	ipam.httpRouter.PathPrefix("/").Handler(archive.FileServer(http.Dir(publicDir)))
	ipam.mutationMtx.Unlock()
	srvInsecure := &http.Server{
		Addr:         ":80",
		Handler:      ipam.httpRouter,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	log.Fatal("ListenAndServe: ", srvInsecure.ListenAndServe())
}
