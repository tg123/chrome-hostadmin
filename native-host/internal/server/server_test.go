package server

import (
	"io"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/tg123/chrome-hostadmin/native-host/internal/hostsfile"
	"github.com/tg123/chrome-hostadmin/native-host/internal/messaging"
)

type harness struct {
	t    *testing.T
	in   *io.PipeWriter
	out  *io.PipeReader
	done chan error
}

func start(t *testing.T, path string) *harness {
	inR, inW := io.Pipe()
	outR, outW := io.Pipe()
	s := &Server{File: hostsfile.File{Path: path}, PollInterval: 20 * time.Millisecond}
	h := &harness{t: t, in: inW, out: outR, done: make(chan error, 1)}
	go func() { h.done <- s.Serve(inR, outW); outW.Close() }()
	t.Cleanup(func() {
		inW.Close()
		go io.Copy(io.Discard, outR) // unblock pending event writes
		<-h.done
	})
	return h
}

func (h *harness) call(req Request) Response {
	h.t.Helper()
	if err := messaging.Write(h.in, req); err != nil {
		h.t.Fatal(err)
	}
	for {
		if r := h.next(); r.Type == "result" {
			return r
		}
	}
}

func (h *harness) next() Response {
	h.t.Helper()
	var r Response
	if err := messaging.Read(h.out, &r); err != nil {
		h.t.Fatal(err)
	}
	return r
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestReadWriteAndConflict(t *testing.T) {
	path := filepath.Join(t.TempDir(), "hosts")
	writeFile(t, path, "127.0.0.1 a\n")
	h := start(t, path)

	r := h.call(Request{ID: 1, Cmd: "read"})
	if !r.OK || r.ID != 1 || *r.Content != "127.0.0.1 a\n" {
		t.Fatalf("read: %+v", r)
	}

	time.Sleep(10 * time.Millisecond)
	w := h.call(Request{ID: 2, Cmd: "write", Content: "127.0.0.1 b\n", BaseVersion: r.Version})
	if !w.OK || w.Version == "" {
		t.Fatalf("write: %+v", w)
	}

	c := h.call(Request{ID: 3, Cmd: "write", Content: "x\n", BaseVersion: r.Version})
	if c.OK || c.Code != "CONFLICT" {
		t.Fatalf("expected conflict: %+v", c)
	}

	if u := h.call(Request{ID: 4, Cmd: "bogus"}); u.OK || u.Code != "EINVAL" {
		t.Fatalf("unknown cmd: %+v", u)
	}
}

func TestChangedEvent(t *testing.T) {
	path := filepath.Join(t.TempDir(), "hosts")
	writeFile(t, path, "a\n")
	h := start(t, path)

	time.Sleep(50 * time.Millisecond)
	writeFile(t, path, "changed outside\n")

	got := make(chan Response, 1)
	go func() {
		var r Response
		if messaging.Read(h.out, &r) == nil {
			got <- r
		}
	}()
	select {
	case r := <-got:
		if r.Type != "changed" || *r.Content != "changed outside\n" {
			t.Fatalf("unexpected event %+v", r)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("no changed event")
	}
}
