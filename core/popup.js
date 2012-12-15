run_from_glue(function(HostAdmin){
	var host_admin = HostAdmin.core;
	var event_host = HostAdmin.event_host;

	var container = HostAdmin.container;
	var searchval = container.curhost();
	var opentab = container.opentab;

	var searchbar = $("#search input");

	var save_alert = function(r){
		if(r){
			$(".alert").hide('slow');
		}else{
			$(".alert").show('slow');
		}
	};

	var host_ul = $("#list");



	var findhost = function(wanted, hosts, group_names){
		var found = {};

		if(hosts[wanted]){
			found[wanted] = hosts[wanted];
		}

		wanted = wanted.toLowerCase();
		for (var h in hosts){
			console.log(h);
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

		return found;
	};

	var make_host_item = function(host,h,i){

		var a = $('<a href="#"><i class="icon-"></i>' + host.addr + '<em class="pull-right">' + host.comment+'</em></a>');
		//a.click((function(host, hostname ,host_index){
		//return function(){
		//	save_alert(host_admin.host_toggle_and_save(hostname, host_index));
		//}})(host,h,i));

		a.click(function(){
			save_alert(host_admin.host_toggle_and_save(h, i));
		});

		var li = $("<li/>").append(a);

		if(host.using){
			li.find('i').addClass('icon-ok');
		}

		return li;
	};

	var make_host_header = function(h){
		var em = $('<i class="icon-globe pull-right"></i>');
		em.click(function(){
			opentab('http://' + h);
		});
		var li = $('<li class="nav-header"></li>');
		li.text(h);
		li.prepend(em);

		return li;
	};

	var make_group_item= function(group_name, group_id, host_list){
		var a = $('<a href="#"><i class="icon-"></i>' + group_name + '<em class="pull-right">' + '' +'</em></a>');
		//a.click((function(host_list, group_id){
		//return function(){
		//	save_alert(host_admin.group_toggle_and_save(host_list, group_id));
		//}})(host_list, group_id));

		a.click(function(){
			save_alert(host_admin.group_toggle_and_save(host_list, group_id));
		});

		var li = $("<li/>").append(a);

		if(host_admin.group_checked(host_list, group_id)){
			li.find('i').addClass('icon-ok');
		}

		return li;
	};

	var redraw = function(){
		var wanted = searchbar.val();
		wanted = $.trim(wanted);

		var oldcontainer = host_ul.find("div");
		var newcontainer = $("<div></div>");
		var hosts = host_admin.get_hosts();
		var group_names = host_admin.get_groups();
		var groups = [];

		for (var h in findhost(wanted, hosts, group_names)){
			var hul = $("<ul/>");
			hul.addClass('nav nav-list');

			var added = false;

			for(var i in hosts[h]){

				var host = hosts[h][i];

				if(host.comment.toUpperCase() == 'HIDE '){
					continue;
				}

				if(!added){
					hul.append(make_host_header(h));
					added = true;
				}

				hul.append(make_host_item(host, h, i));
				
				var g = host.group;
				var gn = group_names[g];
				if(gn){
					if(typeof groups[g] == "undefined"){
						groups[g] = [];
					}
					
					groups[g].push(h);
				}
			}
			
			newcontainer.append(hul);
		}

		if ( groups.length > 0){
			
			var gul = $("<ul/>");
			gul.addClass('nav nav-list');
			gul.append($('<li class="nav-header">' + '<i class="icon-folder-open"></i>GROUPS' + '</li>'));

			for(var group_id in groups){
				var group_name = group_names[group_id];
				var host_list = groups[group_id];

				gul.append(make_group_item(group_name, group_id, host_list));
			}
			newcontainer.append(gul);
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
		redraw();
	}, false);


	// -- init 
	host_admin.refresh();
	var hosts = host_admin.get_hosts();
	if(hosts[searchval]){
		searchbar.val(searchval).select();
	}
	redraw();
}
);
