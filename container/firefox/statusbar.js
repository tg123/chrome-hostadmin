;(function(HostAdmin){
	
	var host_admin = HostAdmin.core;
	var event_host = HostAdmin.event_host;
	var container = HostAdmin.container;
	var opentab = container.opentab;
	
	var updatelb = function(){
		var curHost = container.curhost();

		var str = "Not in Hosts";
		var hosts = host_admin.get_hosts();
		if (typeof hosts[curHost] != "undefined") {
			hosts = hosts[curHost];
			for (var i in hosts){
				str = "In Hosts";
				if(hosts[i].using){
					str = hosts[i].addr + " " + hosts[i].comment;
					break;
				}
			}
		}		
		
		document.getElementById("hostadmin-label").value = str;
	}

	var save_alert = function(r){
		if(r){
		}else{
			try{
				var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
					    .getService(Components.interfaces.nsIAlertsService);
			

				alertsService.showAlertNotification('chrome://hostadmin-icons/content/icon32.png', 'HostAdmin'
				, 'Write hosts file failed check permissions, Click to Learn more',
				true, null,{  
					observe: function(subject, topic, data) {  
						if(topic == 'alertclickcallback'){
							opentab('PERMHELP');
						}
					}  
				});
			}catch(e){} // mac without growl
		}
	}
	
	var mk_menu_item = function(hostname, host , host_index){
		var mi = document.createElement("menuitem");
		mi.setAttribute("label",host.addr);
		mi.setAttribute("acceltext", host.comment.substr(0,20));
		mi.setAttribute("description", "Double Click to Visit");
		mi.setAttribute("type","checkbox");
		mi.addEventListener("command", function(e){
			save_alert(host_admin.host_toggle_and_save(hostname, host_index));
		}, false);
		
		if(host.using){
			mi.setAttribute("checked",true);
		}
		return mi;
	}

	var mk_menu_gp_item = function(group_name, group_id, host_list){
		var mi = document.createElement("menuitem");
		mi.setAttribute("label", group_name.substr(0,35));
		mi.setAttribute("acceltext", "Group");
		mi.setAttribute("type","checkbox");
		mi.addEventListener("command", function(e){
			save_alert(host_admin.group_toggle_and_save(host_list, group_id));
		}, false);
		if(host_admin.group_checked(host_list, group_id)){
			mi.setAttribute("checked",true);
		}
		return mi;
	}

	const editor_item = (function(){
			var mi = document.createElement("menuitem");
			mi.setAttribute("label", "Host Editor");

			mi.addEventListener("command", function(e){
				opentab('EDITOR')
			}, false);
			return mi;
		})();

	// {{{ refresh menu
	var refresh_menu = function(asc){
		var curHost = container.curhost();
		var menu = document.getElementById("hostadmin-popup");
		
		while (menu.lastChild) menu.removeChild(menu.lastChild);
		var hosts = host_admin.get_hosts();
		var group_names = host_admin.get_groups();
		var groups = [];

		var hasOther = false;
		var tosortKey = [];
		var tosortM = [];
			
		for (var h in hosts){
			var sub = document.createElement("menu");
			sub.setAttribute("label", h);

			sub.addEventListener("dblclick", (function(h){ 
				return function(e){
						opentab("http://" + h);
					}
				})(h), false);

			sub.setAttribute("acceltext", h.charAt(0).toUpperCase());
			var popup = document.createElement("menupopup");
			sub.appendChild(popup);
			var hide = true;
			for (var i in hosts[h]){
				if(hosts[h][i].comment.toUpperCase() != 'HIDE '){
					popup.appendChild(mk_menu_item(h, hosts[h][i], i));
					hasOther = true;
					hide = false;
				}

				var g = hosts[h][i].group;
				var gn = group_names[g];
				if(gn){
					if(typeof groups[g] == "undefined"){
						groups[g] = [];
					}
					
					groups[g].push(h);
				}
			}

			if(!hide && h!= curHost){
				tosortKey.push(h);
				tosortM[h] = sub;
			}
		}
		tosortKey = tosortKey.sort()
		for (var k in tosortKey){
			menu.appendChild(tosortM[tosortKey[k]]);
		}

		if ( groups.length > 0){
			if(hasOther){
				menu.appendChild(document.createElement("menuseparator"));
			}

			for(var g in groups){
				menu.appendChild(mk_menu_gp_item(group_names[g], g, groups[g]));
			}
		}

		var hasCur = false;
		if (typeof hosts[curHost] != "undefined") {
			if(hasOther){
				if(asc){
					menu.insertBefore(document.createElement("menuseparator"), menu.firstChild);
				}else{
					menu.appendChild(document.createElement("menuseparator"));
				}

			}
			hosts = hosts[curHost];
			for (var i in hosts){
				if(hosts[i].comment.toUpperCase() != 'HIDE '){
					if(asc){
						menu.insertBefore(mk_menu_item(curHost, hosts[i], i), menu.firstChild);
					}else{
						menu.appendChild(mk_menu_item(curHost, hosts[i], i));
					}
					hasCur = true;
				}
			}
			if(!hasCur && hasOther){
				if(asc){
					menu.removeChild(menu.firstChild);
				}else{
					menu.removeChild(menu.lastChild);
				}
			}
		}


		if(hasOther || hasCur){
			menu.insertBefore(document.createElement("menuseparator"), menu.firstChild);
		}
		menu.insertBefore(editor_item, menu.firstChild);
	}
	// }}} refresh menu
	

	var onclick = function(target, event){
		if(event.button && event.button != 0) return false;

		host_admin.refresh();
		refresh_menu(target == document.getElementById('hostadmin-toolbar-button'));

		var menu = document.getElementById("hostadmin-popup");

		menu.openPopup(target, "before_end", 0 ,0, true);
		return false;
	}

	var onload = function(event){
		
		var panel_label = document.getElementById("hostadmin-label");
		panel_label.addEventListener('mousedown', function(e) {
			onclick(panel_label, e);
		}, false);
		
		
		window.getBrowser().addProgressListener({
			onLocationChange: function(aWebProgress, aRequest, aLocation){
				updatelb();
			}
		});

	}
	
	
	window.addEventListener("load", onload, false);

	event_host.addEventListener('HostAdminRefresh', function(e) {
		updatelb();
	}, false);

})(window.HostAdmin);

