run_from_glue(function(HostAdmin){
	var host_admin = HostAdmin.core;
	var event_host = HostAdmin.event_host;
	var configure = HostAdmin.config;

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

	var weight = function(stra, strb){
		var l = new Levenshtein(stra, strb);
		l = l.distance / l.longestDistance();

		// Rule
		var p = strb.indexOf(stra);
		if(p === 0) l -= 0.15;
		if(p > 0) l -= 0.1;

		if(stra[0] == strb[0]) l -= 0.1;

		return l;
	};

	var GROUP_PLACE_HOLDER_KEY = '@GROUP';
	var findhost = function(wanted, hosts, group_names){
		var found = [];
		var min_groupl = 1;

		for (var h in hosts){
			var minl = weight(wanted, h);

			for(var i in hosts[h]){
				var host = hosts[h][i];
				var gn = group_names[host.group];

				if (gn) {
					var gl = weight(wanted, gn);
					minl = Math.min(minl, gl);
					min_groupl = Math.min(min_groupl, gl);
				}

				var comment = host.comment;
				if (comment) {
					minl = Math.min(minl, weight(wanted, comment));
				}

			}

			found.push({'host': h , 'ld': minl});
		}
		found.push({'host': GROUP_PLACE_HOLDER_KEY , 'ld': configure.get('groupup') ? 0 : min_groupl});

		
		// TODO insert might be better
		found.sort(function(a,b) { return a.ld - b.ld; });
		return found;
	};

	var make_host_item = function(host,h,i){

		var a = $('<a href="#"><i class="icon-"></i>' + 
		host.addr + (host.comment ? '<em class="badge pull-right hostcomment" title="' + host.comment + '">' + host.comment + '</em>' : '' ) + 
		// '<i class="hostgroup pull-right hide"></i></a>');
		'</a>');

		a.click(function(){
			save_alert(host_admin.host_toggle_and_save(h, i));
		});

		var em = $('<i class="icon-edit pull-right hide"></i>');
		em.click(function(){
			opentab('EDITOR', host.line);
		});

		var li = $("<li/>").append(a);
		li.prepend(em);

		if(host.using){
			li.find('i.icon-').addClass('icon-ok');
		}

		if(host.group > 0){
			a.hover(function(){
				var group = li.find('i.hostgroup'); 
				group.addClass('icon-folder-open');
			});
		}

		return li;
	};

	var make_host_header = function(h){
		var em = $('<i class="icon-globe pull-right hide"></i>');
		em.attr('title', 'Open http://' + h);
		em.click(function(){
			opentab('http://' + h);
		});
		var li = $('<li class="nav-header"></li>');
		li.text(h);
		li.prepend(em);

		return li;
	};

	var make_group_item = function(group_name, group_id, host_list){
		var a = $('<a href="#"><i class="icon-"></i>' + group_name + '<em class="pull-right">' + '' +'</em></a>');

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

		var group_place_holder = null;

		findhost(wanted, hosts, group_names).forEach(function(h){
			h = h.host;
			var hul = $("<ul/>");
			hul.addClass('nav nav-list');

			if(h === GROUP_PLACE_HOLDER_KEY){
				group_place_holder = hul;
			}else{
				var added = false;
				var addblock = {};
				for(var i in hosts[h]){

					var host = hosts[h][i];

					if(host.hide){
						continue;
					}

					if(!added){
						hul.append(make_host_header(h));
						added = true;
					}

					var g = host.group;
					var gn = group_names[g];
					if(gn){
						if(typeof groups[g] == "undefined"){
							groups[g] = [];
						}
						
						groups[g].push(h);

						if(!host.comment){
							host.comment = gn;
						}
					}

					// auto merge blocker 
					// do not block if has comment
					if(host.comment || !addblock[host.addr]){
						addblock[host.addr] = true;
						hul.append(make_host_item(host, h, i));
					}

				}
			}
			
			newcontainer.append(hul);
		});

		if ( groups.length > 0){
			
			var em = $('<i class="pull-right hide"></i>');
			if(configure.get('groupup')){
				em.addClass('icon-arrow-down');
			}else{
				em.addClass('icon-arrow-up');
			}
			em.click(function(){
				configure.set('groupup', !configure.get('groupup'));
				redraw();
			});
			var gul = group_place_holder;
			var gli = $('<li class="nav-header">' + '<i class="icon-folder-open"></i>GROUPS' + '</li>')
			gli.append(em);
			gul.append(gli);

			for(var group_id in groups){
				var group_name = group_names[group_id];
				var host_list = groups[group_id];

				gul.append(make_group_item(group_name, group_id, host_list));
			}
		}else{
			// because of #hide
			group_place_holder.remove();
		}

		oldcontainer.replaceWith(newcontainer);
	};


	searchbar.keyup(function(){
		redraw();
		//host_ul.animate({scrollTop:0}, 'fast');
		host_ul.scrollTop(0);
	});

	$(document.body).keydown(function(){
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

	searchval = host_admin.real_hostname(searchval);
	searchbar.val(searchval).select();

	redraw();
	host_ul.scrollTop(0);
}
);
