run_from_glue(function(HostAdmin){
	var host_admin = HostAdmin.core;
	var event_host = HostAdmin.event_host;

	var container = HostAdmin.container;
	var opentab = container.opentab;

	var changed = false;
	var codeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
		lineNumbers: true,
		styleActiveLine: true
	});

	var save = $("#btnSave");

	codeMirror.on("change",  function(){
		changed = true;
		save.attr("disabled", null);
	});

	codeMirror.setValue(host_admin.load());

	var move_cursor = function(cursorline){
		if(cursorline || cursorline === 0){
			codeMirror.setCursor(cursorline);
			codeMirror.scrollIntoView({line: cursorline}, 150);
			codeMirror.focus();
		}
	}

	move_cursor(HostAdmin.cursorline);

	var renew = function(){
		changed = false;
		save.attr("disabled", "disabled");
		$(".alert").hide('slow');
	};

	var reload = function(){
		var pos = codeMirror.getScrollInfo()
		codeMirror.setValue(host_admin.load());
		renew();
		codeMirror.scrollTo(pos.left, pos.top);
	};

	$("#mreload").click(function(){
		$("#contentchanged").modal('hide');

		reload();
	});

	event_host.addEventListener('HostAdminRefresh', function(e) {
		if(!changed){
			reload();
		}else{
			$("#contentchanged").modal('show');
		}
	}, false);


	event_host.addEventListener('HostAdminReqCursorLine', function(e) {
		move_cursor(e.detail.cursorline);
	}, false);

	save.click(function(e) {
		if(changed){
			changed = false;
			
			var pos = codeMirror.getScrollInfo()

			if(host_admin.save(codeMirror.getValue())){
				renew();
				codeMirror.scrollTo(pos.left, pos.top);
			}else{
				$(".alert").show('slow');
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

	$(".alert a").click(function(){
		opentab('PERMHELP');
	});

	renew();

});
