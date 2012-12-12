;(function(HostAdmin){

	var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	timer.init((function(){
		var host_admin = HostAdmin.core;

		return { 
			observe: function(subject, topic, data){
				host_admin.refresh();
			},
		};

	})(), 1000, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);

	HostAdmin.dontgc = timer; //prevent form being gc

})(window.HostAdmin);
