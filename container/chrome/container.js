;(function(HostAdmin){	

	var host_admin = HostAdmin.core;
	var event_host = HostAdmin.event_host;
	var cur_host;

	var opentab = function(t, line){
		var url = null;
		if(t == 'EDITOR'){
			url = chrome.runtime.getURL('core/editor.html');
		}else if (t == 'PERMHELP'){
			url = HostAdmin.PERM_HELP_URL;
		}else{
			url = t;
		}

		if(url){
			chrome.tabs.query({ url : url ,windowId: chrome.windows.WINDOW_ID_CURRENT }, function(t){
				HostAdmin.cursorline = line;

				if (t.length > 0){
					chrome.tabs.update(t[0].id, {active : true});
					HostAdmin.requestCursorLine(line);
				}else{
					chrome.tabs.create({url: url});
				}

			});
		}   
	};
	
	var hostreg = /:\/\/([\w\.\-]+)/;
	var extracthost = function(url){
		if(url) {
			cur_host = url.match(hostreg)[1];
		}
		updatelb();

	};
	
	var updatelb = function(){
		var curHost = host_admin.real_hostname(cur_host);

		var str = "";
		var hosts = host_admin.get_hosts();
		if (typeof hosts[curHost] != "undefined") {
			hosts = hosts[curHost];
			for (var i in hosts){
				str = "*";
				if(hosts[i].using){
					str = hosts[i].addr + " " + hosts[i].comment;
					break;
				}
			}
		}		

		chrome.browserAction.setBadgeBackgroundColor({color:'#0A0'});
		chrome.browserAction.setBadgeText({text:str});

		if(str == '*') { str = 'In Hosts';}
		else if( str === "" ) { str = 'Not In Hosts';}

		chrome.browserAction.setTitle({title: str});
		
	};

	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
		extracthost(changeInfo.url);
	});
	chrome.tabs.onActivated.addListener(function(activeInfo){
		chrome.tabs.query({ active: true , windowType: "normal", windowId: chrome.windows.WINDOW_ID_CURRENT }, function(t){
			if (t.length > 0){
				extracthost(t[0].url); }
		});
	});

	HostAdmin.container = {
		opentab : opentab,
		curhost : function(){ return cur_host;}
	};

	event_host.addEventListener('HostAdminRefresh', function(e) {
		updatelb();
		chrome.browsingData.removeCache({});
	}, false);
})(window.HostAdmin);
