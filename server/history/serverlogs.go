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
	buf *protectedBuffer
}

// NewServerLogger copys all logging into a buffer that can be retrieved with GetString()
func NewServerLogger() *ServerLogger {
	pb := &protectedBuffer{}
	mw := io.MultiWriter(os.Stdout, pb)
	log.SetOutput(mw)
	return &ServerLogger{pb}
}

// GetString returns the raw multiline string seen in stdout
func (s *ServerLogger) GetString() string {
	return s.buf.String()
}

type protectedBuffer struct {
	b bytes.Buffer
	m sync.Mutex
}

func (b *protectedBuffer) Read(p []byte) (n int, err error) {
	b.m.Lock()
	defer b.m.Unlock()
	return b.b.Read(p)
}
func (b *protectedBuffer) Write(p []byte) (n int, err error) {
	b.m.Lock()
	defer b.m.Unlock()
	return b.b.Write(p)
}
func (b *protectedBuffer) String() string {
	b.m.Lock()
	defer b.m.Unlock()
	return b.b.String()
}
