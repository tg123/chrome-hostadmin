;(function(HostAdmin){
	var EDITOR_URL = 'chrome://hostadmin/content/editor.html';
	var PERM_HELP_URL = HostAdmin.PERM_HELP_URL;

	// {{{ copy from https://developer.mozilla.org/en-US/docs/Code_snippets/Tabbed_browser
	function openAndReuseOneTabPerURL(url) {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var browserEnumerator = wm.getEnumerator("navigator:browser");

		// Check each browser instance for our URL
		var found = false;
		while (!found && browserEnumerator.hasMoreElements()) {
			var browserWin = browserEnumerator.getNext();
			var tabbrowser = browserWin.gBrowser;

			// Check each tab of this browser instance
			var numTabs = tabbrowser.browsers.length;
			for (var index = 0; index < numTabs; index++) {
				var currentBrowser = tabbrowser.getBrowserAtIndex(index);
				//if (url == currentBrowser.currentURI.spec) {
				if (currentBrowser.currentURI.spec.indexOf(url) == 0) {

					// The URL is already opened. Select this tab.
					tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];

					// Focus *this* browser-window
					browserWin.focus();

					found = true;
					break;
				}
			}
		}

		// Our URL isn't open. Open it now.
		if (!found) {
			var recentWindow = wm.getMostRecentWindow("navigator:browser");
			if (recentWindow) {
				// Use an existing browser window
				recentWindow.delayedOpenTab(url, null, null, null, null);
			}
			else {
				// No browser windows are open, so open a new one.
				window.open(url);
			}
		}
	}
	// }}}

	var cur_host = "";
	window.getBrowser().addProgressListener({
		onLocationChange: function(aWebProgress, aRequest, aLocation){
			try{
				if (aLocation && aLocation.host){
					if(aLocation.scheme != 'chrome'){
						cur_host = aLocation.host;
					}
				}
			}catch(e){}
		}
	});

	var opentab = function(t){
		var url = null;
		if(t == 'EDITOR'){
			url = EDITOR_URL;
		}else if (t == 'PERMHELP'){
			url = PERM_HELP_URL;
		}else{
			url = t;
		}

		if(url){
			openAndReuseOneTabPerURL(url);
			document.getElementById("hostadmin-menu-panel").hidePopup();
		}
	};

	HostAdmin.container = {
		opentab : opentab,
		curhost : function(){ return cur_host; }
	};

	var popuphelper = {
		HostAdmin : HostAdmin
	};

	window.addEventListener('DOMWindowCreated', function(e){
		if(
		e.target.documentURI.indexOf(document.getElementById('hostadmin-menu-content').getAttribute('src')) === 0
		||
		e.target.documentURI.indexOf(EDITOR_URL) === 0
		){
			e.target.defaultView.window.firefox = popuphelper;
		}
	}, true);

	window.addEventListener("load", function(){
		document.getElementById('hostadmin-toolbar-button').addEventListener('command', function(e){
			var menucontent = document.getElementById('hostadmin-menu-content').contentWindow;
			menucontent.focus();
			var $ = menucontent.window.$;

			$("#search input").val(cur_host).keyup();
		}, false);
	}, false);


})(window.HostAdmin);
