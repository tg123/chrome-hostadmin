// Command hostadmin-host is the HostAdmin native messaging host.
//
// Browsers launch it with their own arguments (an extension origin or a
// manifest path); in that case it serves the messaging protocol on stdio.
// Users run it directly to register or unregister it with their browsers.
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/tg123/chrome-hostadmin/native-host/internal/hostsfile"
	"github.com/tg123/chrome-hostadmin/native-host/internal/install"
	"github.com/tg123/chrome-hostadmin/native-host/internal/server"
)

var version = "dev"

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "install", "uninstall":
			if err := runInstall(os.Args[1], os.Args[2:]); err != nil {
				fmt.Fprintln(os.Stderr, "error:", err)
				os.Exit(1)
			}
			return
		case "version", "--version":
			fmt.Println(version)
			return
		case "help", "-h", "--help":
			usage()
			return
		}
	}

	s := &server.Server{File: hostsfile.Default(), PollInterval: time.Second}
	if err := s.Serve(os.Stdin, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "hostadmin-host:", err)
		os.Exit(1)
	}
}

func usage() {
	fmt.Fprintf(os.Stderr, `HostAdmin native messaging host %s

Usage:
  hostadmin-host install [--chrome-id ID[,ID...]] [--firefox-id ID]
  hostadmin-host uninstall
  hostadmin-host version

Without a command the host speaks the native messaging protocol on stdio.
Set %s to manage a file other than the system hosts file.
`, version, hostsfile.EnvOverride)
}

func runInstall(cmd string, args []string) error {
	fs := flag.NewFlagSet(cmd, flag.ContinueOnError)
	chromeIDs := fs.String("chrome-id", "", "comma separated Chrome/Edge extension IDs (default "+install.DefaultChromeID+")")
	firefoxID := fs.String("firefox-id", install.FirefoxID, "Firefox add-on ID")
	if err := fs.Parse(args); err != nil {
		return err
	}

	exe, err := os.Executable()
	if err != nil {
		return err
	}
	if exe, err = filepath.EvalSymlinks(exe); err != nil {
		return err
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	o := install.Options{
		ExePath:   exe,
		FirefoxID: *firefoxID,
		Targets:   install.Targets(runtime.GOOS, home, filepath.Dir(exe)),
	}
	if runtime.GOOS == "windows" {
		o.Registry = install.RegExe{}
	}
	for _, id := range strings.Split(*chromeIDs, ",") {
		if id = strings.TrimSpace(id); id != "" {
			o.ChromeIDs = append(o.ChromeIDs, id)
		}
	}

	if cmd == "uninstall" {
		if err := install.Uninstall(o); err != nil {
			return err
		}
		fmt.Println("HostAdmin native host unregistered.")
		return nil
	}

	browsers, err := install.Install(o)
	if err != nil {
		return err
	}
	if len(browsers) == 0 {
		return fmt.Errorf("no supported browser profile found under %s", home)
	}
	fmt.Printf("Registered %s for: %s\n", exe, strings.Join(browsers, ", "))
	fmt.Println("Keep this executable in place; browsers launch it from this path.")
	return nil
}
