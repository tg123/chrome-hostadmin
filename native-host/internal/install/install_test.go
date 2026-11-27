package install

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"testing"
)

type fakeRegistry map[string]string

func (f fakeRegistry) SetDefault(k, v string) error { f[k] = v; return nil }
func (f fakeRegistry) Delete(k string) error        { delete(f, k); return nil }

func readManifest(t *testing.T, path string) map[string]any {
	t.Helper()
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatal(err)
	}
	return m
}

func TestInstallOnlyDetectedBrowsers(t *testing.T) {
	home := t.TempDir()
	os.MkdirAll(filepath.Join(home, ".config", "google-chrome"), 0o755)
	os.MkdirAll(filepath.Join(home, ".mozilla"), 0o755)

	exe := filepath.Join(home, "bin", "hostadmin-host")
	o := Options{ExePath: exe, ChromeIDs: []string{"abc"}, Targets: Targets("linux", home, "")}
	got, err := Install(o)
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(got, []string{"Chrome", "Firefox"}) {
		t.Fatalf("installed for %v", got)
	}

	cm := readManifest(t, filepath.Join(home, ".config", "google-chrome", "NativeMessagingHosts", HostName+".json"))
	if cm["path"] != exe || cm["allowed_origins"].([]any)[0] != "chrome-extension://abc/" {
		t.Fatalf("chrome manifest: %v", cm)
	}
	fm := readManifest(t, filepath.Join(home, ".mozilla", "native-messaging-hosts", HostName+".json"))
	if fm["allowed_extensions"].([]any)[0] != FirefoxID {
		t.Fatalf("firefox manifest: %v", fm)
	}

	if err := Uninstall(o); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(home, ".mozilla", "native-messaging-hosts", HostName+".json")); !os.IsNotExist(err) {
		t.Fatal("manifest not removed")
	}
}

func TestInstallWindowsRegistry(t *testing.T) {
	dir := t.TempDir()
	reg := fakeRegistry{}
	o := Options{ExePath: filepath.Join(dir, "hostadmin-host.exe"), Targets: Targets("windows", "", dir), Registry: reg}
	if _, err := Install(o); err != nil {
		t.Fatal(err)
	}
	if len(reg) != 3 {
		t.Fatalf("registry: %v", reg)
	}
	for _, target := range o.Targets {
		if reg[target.RegistryKey] != target.ManifestPath() {
			t.Fatalf("%s points at %q", target.Browser, reg[target.RegistryKey])
		}
	}
	cm := readManifest(t, filepath.Join(dir, HostName+".chromium.json"))
	if cm["allowed_origins"].([]any)[0] != "chrome-extension://"+DefaultChromeID+"/" {
		t.Fatalf("default chrome id not used: %v", cm)
	}

	if err := Uninstall(o); err != nil || len(reg) != 0 {
		t.Fatalf("uninstall left %v (%v)", reg, err)
	}
}
