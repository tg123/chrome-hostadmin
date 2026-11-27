// Package messaging implements the browser native messaging wire format:
// each message is a UTF-8 JSON document prefixed by its length as a
// 32-bit unsigned integer in native byte order.
package messaging

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
)

const (
	// MaxOutgoing is the largest message a browser accepts from a native host.
	MaxOutgoing = 1 << 20
	// MaxIncoming bounds what we are willing to buffer from the browser.
	MaxIncoming = 64 << 20
)

// Read decodes one message from r into v. It returns io.EOF when the
// browser closes the pipe between messages.
func Read(r io.Reader, v any) error {
	var n uint32
	if err := binary.Read(r, binary.NativeEndian, &n); err != nil {
		return err
	}
	if n > MaxIncoming {
		return fmt.Errorf("incoming message too large: %d bytes", n)
	}
	buf := make([]byte, n)
	if _, err := io.ReadFull(r, buf); err != nil {
		return err
	}
	return json.Unmarshal(buf, v)
}

// Write encodes v as one message to w.
func Write(w io.Writer, v any) error {
	body, err := json.Marshal(v)
	if err != nil {
		return err
	}
	if len(body) > MaxOutgoing {
		return fmt.Errorf("outgoing message too large: %d bytes", len(body))
	}
	frame := make([]byte, 4+len(body))
	binary.NativeEndian.PutUint32(frame, uint32(len(body)))
	copy(frame[4:], body)
	_, err = w.Write(frame)
	return err
}
