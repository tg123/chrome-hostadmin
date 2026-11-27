package messaging

import (
	"bytes"
	"encoding/binary"
	"errors"
	"io"
	"strings"
	"testing"
)

func TestRoundTrip(t *testing.T) {
	var buf bytes.Buffer
	in := map[string]string{"cmd": "read", "text": "héllo"}
	if err := Write(&buf, in); err != nil {
		t.Fatal(err)
	}
	if got := binary.NativeEndian.Uint32(buf.Bytes()); int(got) != buf.Len()-4 {
		t.Fatalf("length prefix %d, body %d", got, buf.Len()-4)
	}
	var out map[string]string
	if err := Read(&buf, &out); err != nil {
		t.Fatal(err)
	}
	if out["text"] != in["text"] {
		t.Fatalf("got %q", out["text"])
	}
	if err := Read(&buf, &out); !errors.Is(err, io.EOF) {
		t.Fatalf("expected EOF, got %v", err)
	}
}

func TestWriteRejectsOversized(t *testing.T) {
	err := Write(io.Discard, strings.Repeat("x", MaxOutgoing))
	if err == nil {
		t.Fatal("expected error for oversized message")
	}
}

func TestReadRejectsOversized(t *testing.T) {
	var buf bytes.Buffer
	_ = binary.Write(&buf, binary.NativeEndian, uint32(MaxIncoming+1))
	if err := Read(&buf, new(any)); err == nil {
		t.Fatal("expected error for oversized length prefix")
	}
}
