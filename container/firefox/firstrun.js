// HostAdmin
// by T.G.(farmer1992@gmail.com)
//
// MPL v2
// http://code.google.com/p/fire-hostadmin/

(function(){
	// {{{		
	// copy from https://developer.mozilla.org/en/Code_snippets/Toolbar
	function installButton(toolbarId, id, afterId) {  
		if (!document.getElementById(id)) {  
			var toolbar = document.getElementById(toolbarId);  

			// If no afterId is given, then append the item to the toolbar  
			var before = null;  
			if (afterId) {  
				var elem = document.getElementById(afterId);  
				if (elem && elem.parentNode == toolbar)  
				before = elem.nextElementSibling;  
			}

			toolbar.insertItem(id, before);  
			toolbar.setAttribute("currentset", toolbar.currentSet);  
			document.persist(toolbar.id, "currentset");  

			if (toolbarId == "addon-bar")  
				toolbar.collapsed = false;  
		}  
	}  
	// }}}


	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
	prefs = prefs.getBranch("extensions.hostadmin.");

	var firstrun = prefs.getBoolPref("firstrun");

	if (firstrun) {
		prefs.setBoolPref("firstrun", false);
		window.addEventListener("load", function(){
			installButton("nav-bar", "hostadmin-toolbar-button");  
		}, false);
	}

})();

