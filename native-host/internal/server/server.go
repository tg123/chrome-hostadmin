// Package server implements the HostAdmin native messaging protocol.
//
// Requests, responses (correlated by id) and unsolicited change events:
//
//	-> {"id": 1, "cmd": "read"}
//	<- {"id": 1, "type": "result", "ok": true, "content": "...", "version": "..."}
//	-> {"id": 2, "cmd": "write", "content": "...", "baseVersion": "..."}
//	<- {"id": 2, "type": "result", "ok": false, "code": "CONFLICT", "error": "..."}
//	<- {"type": "changed", "ok": true, "content": "...", "version": "..."}
package server

import (
	"errors"
	"io"
	"runtime"
	"sync"
	"time"

	"github.com/tg123/chrome-hostadmin/native-host/internal/hostsfile"
	"github.com/tg123/chrome-hostadmin/native-host/internal/messaging"
)

// ProtocolVersion is bumped on incompatible protocol changes.
const ProtocolVersion = 1

type Request struct {
	ID          int    `json:"id"`
	Cmd         string `json:"cmd"`
	Content     string `json:"content,omitempty"`
	BaseVersion string `json:"baseVersion,omitempty"`
}

type Response struct {
	ID       int     `json:"id,omitempty"`
	Type     string  `json:"type"`
	OK       bool    `json:"ok"`
	Error    string  `json:"error,omitempty"`
	Code     string  `json:"code,omitempty"`
	Content  *string `json:"content,omitempty"`
	Version  string  `json:"version,omitempty"`
	Path     string  `json:"path,omitempty"`
	OS       string  `json:"os,omitempty"`
	Protocol int     `json:"protocol,omitempty"`
}

type Server struct {
	File         hostsfile.File
	PollInterval time.Duration

	mu      sync.Mutex // guards out and lastVer
	out     io.Writer
	lastVer string
}

// Serve handles requests from in until EOF, pushing "changed" events to out
// whenever the hosts file is modified by another program.
func (s *Server) Serve(in io.Reader, out io.Writer) error {
	s.out = out
	s.lastVer, _ = s.File.Version()

	stop := make(chan struct{})
	defer close(stop)
	if s.PollInterval > 0 {
		go s.watch(stop)
	}

	for {
		var req Request
		if err := messaging.Read(in, &req); err != nil {
			if errors.Is(err, io.EOF) {
				return nil
			}
			return err
		}
		if err := s.send(s.handle(req)); err != nil {
			return err
		}
	}
}

func (s *Server) handle(req Request) Response {
	resp := Response{ID: req.ID, Type: "result"}
	switch req.Cmd {
	case "info":
		resp.OK = true
		resp.Path = s.File.Path
		resp.OS = runtime.GOOS
		resp.Protocol = ProtocolVersion
	case "read":
		content, ver, err := s.File.Read()
		if err != nil {
			return withError(resp, err)
		}
		s.setLastVersion(ver)
		resp.OK, resp.Content, resp.Version, resp.Path = true, &content, ver, s.File.Path
	case "write":
		ver, err := s.File.Write(req.Content, req.BaseVersion)
		if err != nil {
			return withError(resp, err)
		}
		s.setLastVersion(ver)
		resp.OK, resp.Version = true, ver
	default:
		resp.Error, resp.Code = "unknown command: "+req.Cmd, "EINVAL"
	}
	return resp
}

func (s *Server) watch(stop <-chan struct{}) {
	t := time.NewTicker(s.PollInterval)
	defer t.Stop()
	for {
		select {
		case <-stop:
			return
		case <-t.C:
		}
		ver, err := s.File.Version()
		if err != nil {
			continue
		}
		s.mu.Lock()
		changed := ver != s.lastVer
		s.mu.Unlock()
		if !changed {
			continue
		}
		content, ver, err := s.File.Read()
		if err != nil {
			continue
		}
		s.setLastVersion(ver)
		_ = s.send(Response{Type: "changed", OK: true, Content: &content, Version: ver})
	}
}

func (s *Server) setLastVersion(v string) {
	s.mu.Lock()
	s.lastVer = v
	s.mu.Unlock()
}

func (s *Server) send(r Response) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return messaging.Write(s.out, r)
}

func withError(r Response, err error) Response {
	r.OK = false
	r.Error = err.Error()
	r.Code = hostsfile.ErrorCode(err)
	return r
}
