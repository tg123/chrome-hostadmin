// 
// finding a method to be injected from container ...
//
;window.run_from_glue = (function(){

	var _inner;

	if(typeof(chrome) == 'object'){

		var HostAdmin = chrome.extension.getBackgroundPage().HostAdmin;
		var host_admin = HostAdmin.core;
		var host_file_wrapper = HostAdmin.host_file_wrapper;
		var event_host = HostAdmin.event_host;
		
		var opentab = function(t){
			var url = null;
			if(t == 'EDITOR'){
				url = 'core/editor.html';
			}else if (t == 'PERMHELP'){
				url = HostAdmin.PERM_HELP_URL;
			} 

			if(url){
				chrome.tabs.create({url: url});
			}   
		}   

		_inner = function(callback){
			chrome.windows.getCurrent(function(w){
				chrome.tabs.query({ active: true , windowType: "normal", windowId:w.id }, function(t){
					if (t.length > 0){
						var host = t[0].url.match(/:\/\/(.[^/^:]+)/)[1];
						callback(host_admin, host_file_wrapper, event_host, host, opentab);
					}
				});
			});
		}
		
	}else if(typeof(firefox) == 'object'){
		
		var HostAdmin = firefox.HostAdmin;
		var host_admin = HostAdmin.core;
		var host_file_wrapper = HostAdmin.host_file_wrapper;
		var event_host = HostAdmin.event_host;

		_inner = function(callback){
			callback(host_admin, host_file_wrapper, event_host, firefox.curhost(), firefox.opentab);
		}


	}else{
		_inner = function(){}
	}

	return function(_callback){
		_inner( _callback );
	}
})();
