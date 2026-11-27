package hostsfile

import (
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

func TestReadWriteRoundTrip(t *testing.T) {
	f := File{Path: filepath.Join(t.TempDir(), "hosts")}
	if err := os.WriteFile(f.Path, []byte("\xEF\xBB\xBF127.0.0.1 a\r\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	content, v1, err := f.Read()
	if err != nil {
		t.Fatal(err)
	}
	if content != "127.0.0.1 a\n" {
		t.Fatalf("BOM/CRLF not normalised: %q", content)
	}

	// Ensure the mtime moves even on coarse-grained file systems.
	time.Sleep(10 * time.Millisecond)
	v2, err := f.Write("127.0.0.1 b # ünïcode\n", v1)
	if err != nil {
		t.Fatal(err)
	}
	if v2 == v1 {
		t.Fatal("version did not change after write")
	}

	raw, _ := os.ReadFile(f.Path)
	want := "127.0.0.1 b # ünïcode\n"
	if runtime.GOOS == "windows" {
		want = "\xEF\xBB\xBF127.0.0.1 b # ünïcode\r\n"
	}
	if string(raw) != want {
		t.Fatalf("on-disk content %q, want %q", raw, want)
	}
}

func TestWriteConflict(t *testing.T) {
	f := File{Path: filepath.Join(t.TempDir(), "hosts")}
	if err := os.WriteFile(f.Path, []byte("a\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := f.Write("b\n", "stale-version")
	if !errors.Is(err, ErrConflict) || ErrorCode(err) != "CONFLICT" {
		t.Fatalf("expected conflict, got %v", err)
	}
	raw, _ := os.ReadFile(f.Path)
	if string(raw) != "a\n" {
		t.Fatalf("file modified despite conflict: %q", raw)
	}
}

func TestDecodeLegacyFallback(t *testing.T) {
	got := Decode([]byte("1.1.1.1 x # caf\xE9\n"))
	if !utf8Valid(got) {
		t.Fatalf("decoded text is not valid UTF-8: %q", got)
	}
}

func TestErrorCodeMissing(t *testing.T) {
	_, _, err := File{Path: filepath.Join(t.TempDir(), "nope")}.Read()
	if ErrorCode(err) != "ENOENT" {
		t.Fatalf("got %q for %v", ErrorCode(err), err)
	}
}

func utf8Valid(s string) bool {
	for _, r := range s {
		if r == '\uFFFD' {
			return false
		}
	}
	return true
}
