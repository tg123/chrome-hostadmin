// 
// finding a method to be injected from container ...
//
window.run_from_glue = (function(){

	var HostAdmin = null;

	var resolve_hostadmin = function(){
		if(HostAdmin){
			return HostAdmin;
		}
		if(window.hostadminElectron && window.HostAdmin){
			HostAdmin = window.HostAdmin;
		}else if(typeof(chrome) == 'object' && chrome.extension && chrome.extension.getBackgroundPage){
			HostAdmin = chrome.extension.getBackgroundPage().HostAdmin;
		}else if(typeof(firefox) == 'object'){
			HostAdmin = firefox.HostAdmin;
		}
		return HostAdmin;
	};

	var _inner = function(callback){
		callback(resolve_hostadmin());
	};

	return function(_callback){
		_inner( _callback );
	};
})();
