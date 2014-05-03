;(function (HostAdmin) {
    function createWindow(url, wid, width, height, cb)  {
        chrome.app.window.create(url,
            {id: wid, bounds: {width: width, height: height}, resizable: false}, function (win) {
                var b = win.getBounds()
                if (b.width != width || b.height != height) {
                    win.resizeTo(width, height);
                }

                if(cb){
                    cb(win);
                }
            });
    }

    chrome.app.runtime.onLaunched.addListener(function (launchData) {
        createWindow("core/popup.html", "hostadmin_popup", 300, 600);
    });

    var host_admin = HostAdmin.core;
    var event_host = HostAdmin.event_host;
    var cur_host;

    var opentab = function (t, line) {
        var url = null;
        if (t == 'EDITOR') {
            HostAdmin.cursorline = line;
            createWindow("core/editor.html", "hostadmin_editor", 850, 600, function(win){
                HostAdmin.requestCursorLine(line);
            });
            return;
        } else if (t == 'PERMHELP') {
            url = HostAdmin.PERM_HELP_URL;
        } else {
            url = t;
        }

        if (url) {
            window.open(url);
        }
    };

    var hostreg = /:\/\/([\w\.\-]+)/;
    var extracthost = function (url) {
        if (url) {
            cur_host = url.match(hostreg)[1];
        }
        updatelb();

    };

    var updatelb = function () {
        var curHost = host_admin.real_hostname(cur_host);

        var str = "";
        var hosts = host_admin.get_hosts();
        if (typeof hosts[curHost] != "undefined") {
            hosts = hosts[curHost];
            for (var i in hosts) {
                str = "*";
                if (hosts[i].using) {
                    str = hosts[i].addr + " " + hosts[i].comment;
                    break;
                }
            }
        }

        //chrome.browserAction.setBadgeBackgroundColor({color:'#0A0'});
        //chrome.browserAction.setBadgeText({text:str});

        if (str == '*') {
            str = 'In Hosts';
        }
        else if (str === "") {
            str = 'Not In Hosts';
        }

        //chrome.browserAction.setTitle({title: str});

    };

    HostAdmin.container = {
        opentab: opentab,
        curhost: function () {
            return cur_host;
        }
    };

    event_host.addEventListener('HostAdminRefresh', function (e) {
        updatelb();
        //chrome.browsingData.removeCache({});
    }, false);
})(window.HostAdmin);
