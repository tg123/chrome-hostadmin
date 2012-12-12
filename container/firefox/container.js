;(function(HostAdmin){
	const EDITOR_URL = 'chrome://hostadmin/content/editor.html';
	const PERM_HELP_URL = HostAdmin.PERM_HELP_URL;

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
				if (url == currentBrowser.currentURI.spec) {

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
		}

		if(url){
			openAndReuseOneTabPerURL(url);
			document.getElementById("hostadmin-menu-panel").hidePopup();
		}
	}
	HostAdmin.container = {
		opentab : opentab,
		curhost : function(){ return cur_host; }
	};

	var popuphelper = {
		HostAdmin : HostAdmin,
	}

	window.addEventListener('DOMWindowCreated', function(e){
		if(
		e.target.documentURI == document.getElementById('hostadmin-menu-content').getAttribute('src')
		||
		e.target.documentURI == EDITOR_URL
		){
			e.target.defaultView.window.firefox = popuphelper;
		}
	}, true);

})(window.HostAdmin);
