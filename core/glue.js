// 
// finding a method to be injected from container ...
//
window.run_from_glue = (function(){

	var HostAdmin = null;

	if(typeof(chrome) == 'object'){
		HostAdmin = chrome.extension.getBackgroundPage().HostAdmin;
	}else if(typeof(firefox) == 'object'){
		HostAdmin = firefox.HostAdmin;
	}

	var _inner = function(callback){
		callback(HostAdmin);
	};

	return function(_callback){
		_inner( _callback );
	};
})();
