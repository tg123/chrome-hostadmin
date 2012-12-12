run_from_glue(function(host_admin, host_file_wrapper, event_host){

	var changed = false;
	var codeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
		lineNumbers: true,
		onChange: function(){
			changed = true;
			$("#btnSave").attr("disabled", null);
		}
	});

	codeMirror.setValue(host_admin.load());

	var save = $("#btnSave");

	var renew = function(){
		changed = false;
		disableButton();
		save.attr("disabled", "disabled")
	}

	event_host.addEventListener('HostAdminRefresh', function(e) {
		if(!changed){
			codeMirror.setValue(host_admin.load());
			renew();
		}else{
			//TODO add propmt
		}
	}, false);

	save.click(function(e) {
		if(changed){
			changed = false;

			if(host_admin.save(codeMirror.getValue())){
				renew();
			}else{
				alert('Save failed, Check Permission...');
			}
		}
	});

	$(document).keydown(function(event){
		if (event.which == 83 && (event.ctrlKey||event.metaKey)) {
			event.preventDefault();
			save.click();
			return false;
		}
		return true;
	});

	renew();
})
