var host_file_wrapper = (function(){	
	
	var helper = document.getElementById("host_admin_helper");
	var splitchar = "\n";
	const os = helper.os;

	var file_name;
	if (os == "WINNT"){
		splitchar = "\r\n";
		file_name = helper.where + "\\drivers\\etc\\hosts";
	}else if(os == "Linux"){
		file_name = "/etc/hosts";
	}else if(os == "Darwin"){
		file_name = "/etc/hosts";
	}

	return {
		get : function(){
			return helper.get(file_name);
		}
		,
		set : function(data){
			//return helper.set(file_name, data);
			helper.set(file_name, data);
			return helper.get(file_name) == data; // fake 
		}
		,
		time : function(){
			return helper.time(file_name);
		}
		,
		splitchar : splitchar
	};
})();
