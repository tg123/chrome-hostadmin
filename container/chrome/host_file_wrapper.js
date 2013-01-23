;(function(HostAdmin){	
	
	var helper = document.getElementById("host_admin_helper");
	var splitchar = "\n";
	var os = helper.os;

	var file_name;
	if (os == "WINNT"){
		splitchar = "\r\n";
		file_name = helper.where + "\\drivers\\etc\\hosts";
	}else if(os == "Linux"){
		file_name = "/etc/hosts";
	}else if(os == "Darwin"){
		file_name = "/etc/hosts";
	}

	HostAdmin.host_file_wrapper = {
		get : function(){
			return helper.get(file_name);
		},
		set : function(data){
			if (os == "WINNT"){
				data = data.replace(/([^\r])\n/g, "$1\r\n");
			}
			return helper.set(file_name, data);
		},
		time : function(){
			return helper.time(file_name);
		},
		splitchar : splitchar
	};
})(window.HostAdmin);
