run_from_glue(function(host_admin, host_file_wrapper, event_host, searchval ,opentab){
	
	var searchbar = $("#search input");

	// TODO editor.js
	var wrapped_set = function(data){
		// TODO impl set result in npapi
		var r = host_file_wrapper.set(data);
		if(!r){

			// reset time
			$(".alert").show('slow');
			host_admin.reset_modified();	

	//		// alert

		}else{
			$(".alert").hide('slow');
		}

		//host_refresh.tick();	
		
		return r;
	}

	var host_ul = $("#list");

	var redraw = function(){
		var wanted = searchbar.val();
		wanted = $.trim(wanted);

		if(host_admin.refresh()){
			
			//TODO build index
		}
		var oldcontainer = host_ul.find("div");
		var newcontainer = $("<div></div>");
		var hosts = host_admin.get_hosts();
		var group_names = host_admin.get_groups();
		var groups = [];

		var found = [];

		if(hosts[wanted]){
			found[wanted] = hosts[wanted];
		}

		wanted = wanted.toLowerCase();
		for (var h in hosts){
			var hitted = false;
			var hn = h.toLowerCase();
			if(hn.indexOf(wanted) >= 0 && hn != wanted){
				hitted = true;
			}else{
				for(var i in hosts[h]){
					var host = hosts[h][i];
					var g = host.group;
					var gn = group_names[g];
					if(gn && gn.toLowerCase().indexOf(wanted) >= 0){
						hitted = true;
						break;
					}else if(host.comment && host.comment.indexOf(wanted)){
						hitted = true;
						break;
					}
				}
			}

			if(hitted){
				found[h] = hosts[h];
			}
		}

		for (var h in found){
			var ul = $("<ul/>");
			ul.addClass('nav nav-list');

			var addheader = (function(){
				var added = false;

				return function(){
					if(!added){
						ul.append($('<li class="nav-header">' + h + '</li>'));
						added = true;
					}
				};
					
			})();


			for(var i in hosts[h]){

				var host = hosts[h][i];

				if(host.comment.toUpperCase() == 'HIDE '){
					continue;
				}

				var a = $('<a href="javascript:;"><i class="icon-"></i>' + host.addr + '<em class="pull-right">' + host.comment+'</em></a>');
				// var a = $('<a href="javascript:;"><i class="icon-"></i>' + host.addr + '<em class="pull-right">' + host.group +'</em></a>');
				a.click((function(host, hostname ,host_index){
				return function(){
					host_admin.host_toggle(hostname, host_index);
					//host_file_wrapper.set(host_admin.mk_host());
					wrapped_set(host_admin.mk_host());
					redraw();
				}})(host,h,i));

				var li = $("<li/>").append(a);

				if(host.using){
					li.find('i').addClass('icon-ok')
				}


				addheader();
				ul.append(li);
				
				var g = host.group;
				var gn = group_names[g];
				if(gn){
					if(typeof groups[g] == "undefined"){
						groups[g] = [];
					}
					
					groups[g].push(h);
				}
			}
			
			newcontainer.append(ul);
		}

		if ( groups.length > 0){
			
			var ul = $("<ul/>");
			ul.addClass('nav nav-list');
			ul.append($('<li class="nav-header">' + '<i class="icon-folder-open"></i>GROUPS' + '</li>'));

			for(var g in groups){
				var group_name = group_names[g];
				var group_id = g;
				var host_list = groups[g];

				var a = $('<a href="javascript:;"><i class="icon-"></i>' + group_name + '<em class="pull-right">' + '' +'</em></a>');
				a.click((function(host_list, group_id){
				return function(){
					host_admin.group_toggle(host_list, group_id);
					//host_file_wrapper.set(host_admin.mk_host());
					wrapped_set(host_admin.mk_host());
					redraw();
				}})(host_list, group_id));

				var li = $("<li/>").append(a);

				if(host_admin.group_checked(host_list, group_id)){
					li.find('i').addClass('icon-ok')
				}

				ul.append(li);
			}
			newcontainer.append(ul);

			$("#gotogroup").show();
		}

		oldcontainer.replaceWith(newcontainer);
	};


	searchbar.keyup(redraw);

	$(document.body).keydown(function(e){
		searchbar.focus();
	});

	$("#openeditor").click(function(){
		opentab('EDITOR');
	});

	$(".alert a").click(function(){
		opentab('PERMHELP');
	});

	event_host.addEventListener('HostAdminRefresh', function(e) {
		dump(1);
		//redraw();
	}, false);


	// -- init 
	var hosts = host_admin.get_hosts();
	if(hosts[searchval]){
		searchbar.val(searchval).select();
	}
	redraw();

}
)
