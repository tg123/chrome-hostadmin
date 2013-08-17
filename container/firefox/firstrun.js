// HostAdmin
// by T.G.(farmer1992@gmail.com)
//
// MPL v2
// http://code.google.com/p/fire-hostadmin/

(function(HostAdmin){
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


	var fire_config = HostAdmin.config;
	var firstrun = fire_config.get("firstrun");

	if (firstrun) {
		fire_config.set("firstrun", false);
		window.addEventListener("load", function(){
			installButton("nav-bar", "hostadmin-toolbar-button");  
		}, false);
	}

})(window.HostAdmin);
