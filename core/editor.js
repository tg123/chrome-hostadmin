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
		if(cursorline){
			codeMirror.setCursor(cursorline);
			codeMirror.scrollIntoView({line: cursorline}, 150);
			codeMirror.focus();
		}
	}

	move_cursor(HostAdmin.cursorline)

	var renew = function(){
		changed = false;
		save.attr("disabled", "disabled");
		$(".alert").hide('slow');
	};

	var reload = function(){
		codeMirror.setValue(host_admin.load());
		renew();
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
		move_cursor(e.cursorline);
	}, false);

	save.click(function(e) {
		if(changed){
			changed = false;

			if(host_admin.save(codeMirror.getValue())){
				renew();
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
