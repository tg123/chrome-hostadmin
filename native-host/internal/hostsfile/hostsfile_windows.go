//go:build windows

package hostsfile

import (
	"os"
	"path/filepath"
	"syscall"
	"unsafe"
)

const (
	lineEnding = "\r\n"
	// Windows tools disagree on the encoding of BOM-less files, so mark
	// non-ASCII content explicitly as UTF-8.
	bomForNonASCII = true
)

func defaultPath() string {
	root := os.Getenv("SystemRoot")
	if root == "" {
		root = `C:\Windows`
	}
	return filepath.Join(root, "System32", "drivers", "etc", "hosts")
}

var procMultiByteToWideChar = syscall.NewLazyDLL("kernel32.dll").NewProc("MultiByteToWideChar")

// decodeLegacy interprets raw using the system ANSI code page.
func decodeLegacy(raw []byte) string {
	if len(raw) == 0 {
		return ""
	}
	const cpACP = 0
	n, _, _ := procMultiByteToWideChar.Call(cpACP, 0, uintptr(unsafe.Pointer(&raw[0])), uintptr(len(raw)), 0, 0)
	if n == 0 {
		return latin1(raw)
	}
	buf := make([]uint16, n)
	n, _, _ = procMultiByteToWideChar.Call(cpACP, 0, uintptr(unsafe.Pointer(&raw[0])), uintptr(len(raw)), uintptr(unsafe.Pointer(&buf[0])), n)
	if n == 0 {
		return latin1(raw)
	}
	return syscall.UTF16ToString(buf[:n])
}
