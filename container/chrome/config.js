(function(HostAdmin){
	
	var chrome_config = (function(){
		return {
			set: function(key, value){
				localStorage.setItem(key, JSON.stringify(value));
			},
			get: function(key){
				return JSON. parse(localStorage.getItem(key));;
			}
		};
	})();

	HostAdmin.config = chrome_config;
})(window.HostAdmin);
