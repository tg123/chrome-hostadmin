// 
// finding a method to be injected from container ...
//
window.run_from_glue = (function(){

	var _inner = function(callback){

        if(typeof(chrome) == 'object'){
            chrome.runtime.getBackgroundPage(function(background){
                callback(background.HostAdmin);
            });
        }else if(typeof(firefox) == 'object'){
            callback(firefox.HostAdmin);
        }
	};

	return function(_callback){
		_inner( _callback );
	};
})();
