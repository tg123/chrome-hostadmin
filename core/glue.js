// 
// finding a method to be injected from container ...
//
;window.run_from_glue = (function(){

	
	var opentab = function(t){
		var url = null;
		if(t == 'EDITOR'){
			url = 'core/editor.html';
		}else if (t == 'PERMHELP'){
			url = 'http://code.google.com/p/fire-hostadmin/wiki/GAIN_HOSTS_WRITE_PERM';
		}   

		if(url){
			chrome.tabs.create({url: url});
		}   
	}   



	var _inner = function(callback){
		if(chrome && (typeof(callback) == 'function')){

			var HostAdmin = chrome.extension.getBackgroundPage().HostAdmin;
			var host_admin = HostAdmin.core;
			var host_file_wrapper = HostAdmin.host_file_wrapper;

			
			chrome.windows.getCurrent(function(w){
				chrome.tabs.query({ active: true , windowType: "normal", windowId:w.id }, function(t){
					if (t.length > 0){
						var host = t[0].url.match(/:\/\/(.[^/^:]+)/)[1];
						callback(host_admin, host_file_wrapper, host, opentab);
					}
				});
			});
		}
	}

	return function(_callback){
		_inner( _callback );
	}
})();
