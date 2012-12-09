run_from_glue(function(host_admin, host_file_wrapper, event_host){

	var changed = false;
	var codeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
		lineNumbers: true,
		onChange: function(){
			changed = true;
			$("#btnSave").attr("disabled", null);
		}
	});

	codeMirror.setValue(host_file_wrapper.get());

	// limit alert only once per editor
	//doc.alert_mutex = false;

	//var mutex_prompt = function(){
	//	if(!doc.alert_mutex){
	//		doc.alert_mutex = true;

	//		try{
	//			return promptService.confirm(null, 'HostAdmin', 'Hosts file changed, Reload ?');
	//		}finally{
	//			doc.alert_mutex = false;
	//		}
	//	}
	//	return false;
	//}
	var wrapped_set = function(data){
		var r = host_admin.save(data);
		if(!r){
			host_admin.reset_modified();	
			alert('Save failed, Check Permission...');
		}
		return r;
	}

	event_host.addEventListener('HostAdminRefresh', function(e) {
		if(!changed){
			codeMirror.setValue(host_file_wrapper.get());
			renew();
		}
	}, false);
	

	var save = $("#btnSave");

	var falseChanged = function(){
		changed = false;
	}

	var disableButton = function(){
		save.attr("disabled", "disabled")
	}

	var renew = function(){
		falseChanged();
		disableButton();
	}

	save.click(function(e) {
		if(changed){
			falseChanged();
			if(wrapped_set(codeMirror.getValue())){
				renew();
			}
		}
	});

	renew();


	$(document).keydown(function(event){
		if (event.which == 83 && (event.ctrlKey||event.metaKey)) {
			event.preventDefault();
			save.click();
			return false;
		}
		return true;
	});
})();
