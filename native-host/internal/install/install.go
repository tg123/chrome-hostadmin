// Package install registers the native messaging host with installed browsers.
package install

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

const (
	HostName    = "com.github.tg123.hostadmin"
	description = "HostAdmin hosts file helper"

	// DefaultChromeID matches the "key" in the Chrome manifest, so unpacked
	// development builds get this ID too.
	DefaultChromeID = "gipceghmgdijhnbhnbchagbkjlpoifnk"
	// FirefoxID is the add-on ID historically used on addons.mozilla.org.
	FirefoxID = "{bd54afa8-b14a-4d7a-aecf-37e34e882796}"
)

type Kind int

const (
	Chromium Kind = iota
	Firefox
)

// Target is one browser's registration location.
type Target struct {
	Browser string
	Kind    Kind
	// Root must exist for the browser to be considered installed; empty
	// means always register (used on Windows, where registration is cheap).
	Root string
	// Dir is where the manifest file is written.
	Dir string
	// RegistryKey (Windows only) points the browser at the manifest file.
	RegistryKey string
}

func (t Target) ManifestPath() string {
	if t.RegistryKey == "" {
		return filepath.Join(t.Dir, HostName+".json")
	}
	suffix := ".chromium.json"
	if t.Kind == Firefox {
		suffix = ".firefox.json"
	}
	return filepath.Join(t.Dir, HostName+suffix)
}

// Targets lists the supported browsers for an OS.
func Targets(goos, home, exeDir string) []Target {
	switch goos {
	case "windows":
		const reg = `HKCU\Software\`
		return []Target{
			// Chromium, Brave and Vivaldi also read the Google Chrome key.
			{Browser: "Chrome", Kind: Chromium, Dir: exeDir, RegistryKey: reg + `Google\Chrome\NativeMessagingHosts\` + HostName},
			{Browser: "Edge", Kind: Chromium, Dir: exeDir, RegistryKey: reg + `Microsoft\Edge\NativeMessagingHosts\` + HostName},
			{Browser: "Firefox", Kind: Firefox, Dir: exeDir, RegistryKey: reg + `Mozilla\NativeMessagingHosts\` + HostName},
		}
	case "darwin":
		as := filepath.Join(home, "Library", "Application Support")
		chromium := func(name string, parts ...string) Target {
			root := filepath.Join(append([]string{as}, parts...)...)
			return Target{Browser: name, Kind: Chromium, Root: root, Dir: filepath.Join(root, "NativeMessagingHosts")}
		}
		return []Target{
			chromium("Chrome", "Google", "Chrome"),
			chromium("Chromium", "Chromium"),
			chromium("Edge", "Microsoft Edge"),
			chromium("Brave", "BraveSoftware", "Brave-Browser"),
			chromium("Vivaldi", "Vivaldi"),
			{Browser: "Firefox", Kind: Firefox, Root: filepath.Join(as, "Firefox"), Dir: filepath.Join(as, "Mozilla", "NativeMessagingHosts")},
		}
	default:
		cfg := filepath.Join(home, ".config")
		chromium := func(name string, parts ...string) Target {
			root := filepath.Join(append([]string{cfg}, parts...)...)
			return Target{Browser: name, Kind: Chromium, Root: root, Dir: filepath.Join(root, "NativeMessagingHosts")}
		}
		firefox := func(name, root string) Target {
			return Target{Browser: name, Kind: Firefox, Root: root, Dir: filepath.Join(root, "native-messaging-hosts")}
		}
		return []Target{
			chromium("Chrome", "google-chrome"),
			chromium("Chromium", "chromium"),
			chromium("Edge", "microsoft-edge"),
			chromium("Brave", "BraveSoftware", "Brave-Browser"),
			chromium("Vivaldi", "vivaldi"),
			firefox("Firefox", filepath.Join(home, ".mozilla")),
			firefox("Firefox (snap)", filepath.Join(home, "snap", "firefox", "common", ".mozilla")),
		}
	}
}

// Registry abstracts the Windows registry so installation can be tested.
type Registry interface {
	SetDefault(key, value string) error
	Delete(key string) error
}

type Options struct {
	ExePath   string
	ChromeIDs []string
	FirefoxID string
	Targets   []Target
	Registry  Registry
}

// Install writes manifests for every detected browser and returns their names.
func Install(o Options) ([]string, error) {
	if !filepath.IsAbs(o.ExePath) {
		return nil, fmt.Errorf("executable path must be absolute: %s", o.ExePath)
	}
	var done []string
	for _, t := range o.Targets {
		if t.Root != "" {
			if _, err := os.Stat(t.Root); err != nil {
				continue
			}
		}
		if err := os.MkdirAll(t.Dir, 0o755); err != nil {
			return done, err
		}
		data, err := manifest(t.Kind, o)
		if err != nil {
			return done, err
		}
		if err := os.WriteFile(t.ManifestPath(), data, 0o644); err != nil {
			return done, err
		}
		if t.RegistryKey != "" {
			if o.Registry == nil {
				return done, errors.New("registry access is not available on this platform")
			}
			if err := o.Registry.SetDefault(t.RegistryKey, t.ManifestPath()); err != nil {
				return done, fmt.Errorf("%s: %w", t.Browser, err)
			}
		}
		done = append(done, t.Browser)
	}
	return done, nil
}

// Uninstall removes every registration Install could have created.
func Uninstall(o Options) error {
	var errs []error
	for _, t := range o.Targets {
		if err := os.Remove(t.ManifestPath()); err != nil && !errors.Is(err, fs.ErrNotExist) {
			errs = append(errs, err)
		}
		if t.RegistryKey != "" && o.Registry != nil {
			_ = o.Registry.Delete(t.RegistryKey) // absent keys are not an error
		}
	}
	return errors.Join(errs...)
}

func manifest(k Kind, o Options) ([]byte, error) {
	m := map[string]any{
		"name":        HostName,
		"description": description,
		"path":        o.ExePath,
		"type":        "stdio",
	}
	if k == Firefox {
		id := o.FirefoxID
		if id == "" {
			id = FirefoxID
		}
		m["allowed_extensions"] = []string{id}
	} else {
		ids := o.ChromeIDs
		if len(ids) == 0 {
			ids = []string{DefaultChromeID}
		}
		origins := make([]string, len(ids))
		for i, id := range ids {
			origins[i] = "chrome-extension://" + id + "/"
		}
		m["allowed_origins"] = origins
	}
	return json.MarshalIndent(m, "", "  ")
}
