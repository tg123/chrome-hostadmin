//go:build !windows

package hostsfile

const (
	lineEnding     = "\n"
	bomForNonASCII = false
)

func defaultPath() string { return "/etc/hosts" }

func decodeLegacy(raw []byte) string { return latin1(raw) }
