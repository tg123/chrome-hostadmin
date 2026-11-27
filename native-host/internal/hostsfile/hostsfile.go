// Package hostsfile reads and writes the system hosts file.
//
// Content is exchanged with the extension as UTF-8 with LF line endings;
// platform specifics (CRLF, BOM, legacy code pages) are handled here.
package hostsfile

import (
	"bytes"
	"errors"
	"io/fs"
	"os"
	"strconv"
	"strings"
	"unicode/utf8"
)

// EnvOverride lets tests and power users point the host at another file.
const EnvOverride = "HOSTADMIN_HOSTS_FILE"

var utf8BOM = []byte{0xEF, 0xBB, 0xBF}

// ErrConflict is returned by Write when the file changed since baseVersion.
var ErrConflict = errors.New("hosts file was modified by another program")

// File is a hosts file on disk.
type File struct {
	Path string
}

// Default returns the system hosts file, honouring EnvOverride.
func Default() File {
	if p := os.Getenv(EnvOverride); p != "" {
		return File{Path: p}
	}
	return File{Path: defaultPath()}
}

// Version returns an opaque token that changes whenever the file changes.
func (f File) Version() (string, error) {
	st, err := os.Stat(f.Path)
	if err != nil {
		return "", err
	}
	return strconv.FormatInt(st.ModTime().UnixNano(), 36) + "-" + strconv.FormatInt(st.Size(), 36), nil
}

// Read returns the normalised content and its version.
func (f File) Read() (content, version string, err error) {
	version, err = f.Version()
	if err != nil {
		return "", "", err
	}
	raw, err := os.ReadFile(f.Path)
	if err != nil {
		return "", "", err
	}
	return Decode(raw), version, nil
}

// Write replaces the file content. If baseVersion is non-empty the write is
// rejected with ErrConflict when the file no longer has that version.
func (f File) Write(content, baseVersion string) (string, error) {
	if baseVersion != "" {
		cur, err := f.Version()
		if err != nil && !errors.Is(err, fs.ErrNotExist) {
			return "", err
		}
		if cur != baseVersion {
			return "", ErrConflict
		}
	}

	mode := fs.FileMode(0o644)
	if st, err := os.Stat(f.Path); err == nil {
		mode = st.Mode().Perm()
	}
	// Write in place rather than rename: users typically grant write access
	// to the hosts file itself, not to its parent directory.
	if err := os.WriteFile(f.Path, Encode(content), mode); err != nil {
		return "", err
	}
	return f.Version()
}

// Decode converts raw file bytes to UTF-8 text with LF line endings.
func Decode(raw []byte) string {
	var s string
	switch {
	case bytes.HasPrefix(raw, utf8BOM):
		s = string(raw[len(utf8BOM):])
	case utf8.Valid(raw):
		s = string(raw)
	default:
		s = decodeLegacy(raw)
	}
	return strings.ReplaceAll(s, "\r\n", "\n")
}

// Encode converts UTF-8/LF text to the platform's on-disk representation.
func Encode(content string) []byte {
	content = strings.ReplaceAll(content, "\r\n", "\n")
	if lineEnding != "\n" {
		content = strings.ReplaceAll(content, "\n", lineEnding)
	}
	if bomForNonASCII && !isASCII(content) {
		return append(append([]byte{}, utf8BOM...), content...)
	}
	return []byte(content)
}

func isASCII(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] >= utf8.RuneSelf {
			return false
		}
	}
	return true
}

// latin1 is the fallback for non-UTF-8 input where no OS code page is known.
func latin1(raw []byte) string {
	r := make([]rune, len(raw))
	for i, b := range raw {
		r[i] = rune(b)
	}
	return string(r)
}

// ErrorCode classifies an error so the extension can show targeted help.
func ErrorCode(err error) string {
	switch {
	case errors.Is(err, ErrConflict):
		return "CONFLICT"
	case errors.Is(err, fs.ErrPermission):
		return "EACCES"
	case errors.Is(err, fs.ErrNotExist):
		return "ENOENT"
	default:
		return "EIO"
	}
}
