;(function(HostAdmin){	
	var host_admin = HostAdmin.core;

	HostAdmin.dontgc = setInterval(function(){
		host_admin.refresh();
	}, 1000);
})(window.HostAdmin);
