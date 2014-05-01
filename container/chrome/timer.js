;(function(HostAdmin){	
	var host_admin = HostAdmin.core;


    var host_file_wrapper = HostAdmin.host_file_wrapper;

	HostAdmin.dontgc = setInterval(function(){


        host_file_wrapper._refresh(function(){

            host_admin.refresh();
        });

	}, 1000);

})(window.HostAdmin);
