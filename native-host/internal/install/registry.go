package install

import (
	"fmt"
	"os/exec"
	"strings"
)

// RegExe edits the registry with the built-in reg.exe tool, avoiding a
// dependency on golang.org/x/sys.
type RegExe struct{}

func (RegExe) SetDefault(key, value string) error {
	return run("add", key, "/ve", "/t", "REG_SZ", "/d", value, "/f")
}

func (RegExe) Delete(key string) error {
	return run("delete", key, "/f")
}

func run(args ...string) error {
	out, err := exec.Command("reg", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("reg %s: %w: %s", args[0], err, strings.TrimSpace(string(out)))
	}
	return nil
}
