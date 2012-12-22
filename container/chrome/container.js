;(function(HostAdmin){	

	var cur_host;

	var opentab = function(t){
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
				if (t.length > 0){
					chrome.tabs.update(t[0].id, {active : true});
				}else{
					chrome.tabs.create({url: url});
				}
			});
		}   
	};
	
	var hostreg = /:\/\/([\w\.\-]+)/;
	var extracthost = function(url){
		if(url) cur_host = url.match(hostreg)[1];
	};

	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
		extracthost(changeInfo.url);
	});
	chrome.tabs.onActivated.addListener(function(activeInfo){
		chrome.tabs.query({ active: true , windowType: "normal", windowId: chrome.windows.WINDOW_ID_CURRENT }, function(t){
			if (t.length > 0){
				extracthost(t[0].url);
			}
		});
	});

	HostAdmin.container = {
		opentab : opentab,
		curhost : function(){ return cur_host;}
	};
})(window.HostAdmin);
