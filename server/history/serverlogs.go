package history

import (
	"bytes"
	"io"
	"log"
	"os"
	"sync"
)

// ServerLogger is the object containing the threadsafe bytesBuffer
type ServerLogger struct {
	buf     *protectedBuffer
	wrSlice []io.Writer
}

// NewServerLogger copys all logging into a buffer that can be retrieved with GetString()
func NewServerLogger() *ServerLogger {
	pb := newProtectedBuffer()
	wrSlice := []io.Writer{os.Stdout, pb}
	log.SetOutput(io.MultiWriter(wrSlice...))
	return &ServerLogger{pb, wrSlice}
}

// GetString returns the raw multiline string seen in stdout
func (s *ServerLogger) GetString() string {
	return s.buf.String()
}

// AddIOWriter could be used to log to remote syslog or local file
func (s *ServerLogger) AddIOWriter(wr io.Writer) {
	s.buf.m.Lock()
	s.wrSlice = append(s.wrSlice, wr)
	log.SetOutput(io.MultiWriter(s.wrSlice...))
	s.buf.m.Unlock()
}

type protectedBuffer struct {
	b bytes.Buffer
	m sync.Mutex
}

func newProtectedBuffer() *protectedBuffer {
	return &protectedBuffer{
		b: *bytes.NewBuffer(make([]byte, 0)),
		m: sync.Mutex{},
	}
}

func (b *protectedBuffer) Read(p []byte) (n int, err error) {
	b.m.Lock()
	defer b.m.Unlock()
	return b.b.Read(p)
}

const megabyte = 1e6
const limit = 8 * megabyte
const shrinkFactor = 0.75

// https://play.golang.org/p/RIN852Pj6wW

func (b *protectedBuffer) Write(p []byte) (n int, err error) {
	b.m.Lock()
	defer b.m.Unlock()
	if b.b.Len() >= limit {
		start := b.b.Len() - (limit * shrinkFactor)
		b.b = *bytes.NewBuffer(b.b.Bytes()[start:])
	}
	return b.b.Write(p)
}

func (b *protectedBuffer) String() string {
	b.m.Lock()
	defer b.m.Unlock()
	return b.b.String()
}
