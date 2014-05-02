(function(HostAdmin){

    //TODO persistent

    var dict = {}

	var chrome_config = (function(){
		return {
			set: function(key, value){
                dict[key] = value;
//                chrome.storage.sync.set(key, JSON.stringify(value));
			},
			get: function(key){
                return dict[key];
//				return JSON.parse(chrome.storage.sync.get(key));;
			}
		};
	})();

	HostAdmin.config = chrome_config;
})(window.HostAdmin);
