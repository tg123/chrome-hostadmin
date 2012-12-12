;(function(HostAdmin){	

	var cur_host;

	var cur_t = null;
	var opentab = function(t){
		var url = null;
		if(t == 'EDITOR'){
			url = 'core/editor.html';
		}else if (t == 'PERMHELP'){
			url = HostAdmin.PERM_HELP_URL;
		} 

		if(url){
			if(cur_t){
				chrome.tabs.update(cur_t.id, {active : true});
			}else{
				chrome.tabs.create({url: url}, function(t){ cur_t = t });
			}
		}   
	}   

	chrome.tabs.onActivated.addListener(function(activeInfo){
		chrome.tabs.query({ active: true , windowType: "normal", windowId: chrome.windows.WINDOW_ID_CURRENT }, function(t){
			if (t.length > 0){
				cur_host = t[0].url.match(/:\/\/(.[^/^:]+)/)[1];
			}
		});
	});

	HostAdmin.container = {
		opentab : opentab,
		curhost : function(){ return cur_host;}
	};
})(window.HostAdmin);
