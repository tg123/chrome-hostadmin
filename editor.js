;(function(){

	var host_admin = chrome.extension.getBackgroundPage().host_admin;
	var host_file_wrapper = chrome.extension.getBackgroundPage().host_file_wrapper;

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
		// TODO impl set result in npapi
		var r = host_file_wrapper.set(data);
		if(!r){

			// reset time
			host_admin.reset_modified();	
			alert('Save failed, Check Permission...');

	//		// alert

		}

		//host_refresh.tick();	
		
		return r;
	}

	chrome.extension.getBackgroundPage().document.addEventListener('HostAdminRefresh', function(e) {
		if(!changed || mutex_prompt()){
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
})();




//document.addEventListener("keydown", function(e){
//	if (e.ctrlKey && e.keyCode == 83){
//		e && e.preventDefault();
//		var e = document.createEvent('MouseEvents');
//		e.initEvent('click', false, false);
//		button = document.getElementById('btnSave');
//		button.dispatchEvent(e);
//	}
//});
//
