// TODO this file has too many duplicate code
// clean up needed
;(function(HostAdmin){
	
	var host_admin = HostAdmin.core;
	var event_host = HostAdmin.event_host;
	var container = HostAdmin.container;
	var opentab = container.opentab;
	
    var nslookup = function(hostname){
        var ip = "";
        var dnsService = Components.classes["@mozilla.org/network/dns-service;1"].getService(Components.interfaces.nsIDNSService);

        try{
            var records = dnsService.resolve(hostname, 0);
            ip = records.getNextAddrAsString();
        }catch(e){
        } 

        return ip;
    };

	var updatelb = function(){
		var _curHost = container.curhost();
        var ip = "";
		curHost = host_admin.real_hostname(_curHost);

		var comment = "Not in Hosts";
		var hosts = host_admin.get_hosts();
		if (typeof hosts[curHost] != "undefined") {
			hosts = hosts[curHost];
			for (var i in hosts){
				comment = "In Hosts";
				if(hosts[i].using){
                    ip = hosts[i].addr;
                    comment = hosts[i].comment;
					break;
				}
			}
		}

        if (!ip) ip = nslookup(_curHost);
		
		document.getElementById("hostadmin-label").value = ip + " " + comment;
	};

	var save_alert = function(r){
		if(!r){
			try{
				var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
				.getService(Components.interfaces.nsIAlertsService);

				alertsService.showAlertNotification('chrome://hostadmin-icons/content/icon32.png', 'HostAdmin',
				'Write hosts file failed check permissions, Click to Learn more',
				true, null,{  
					observe: function(subject, topic, data) {  
						if(topic == 'alertclickcallback'){
							opentab('PERMHELP');
						}
					}  
				});
			}catch(e){} // mac without growl
		}
	};
	
	var mk_menu_item = function(hostname, host , host_index){
		var mi = document.createElement("menuitem");
		mi.setAttribute("label",host.addr);
		mi.setAttribute("acceltext", host.comment.substr(0,20));
		mi.setAttribute("description", "Double Click to Visit");
		mi.setAttribute("type","checkbox");
		mi.addEventListener("command", function(){
			save_alert(host_admin.host_toggle_and_save(hostname, host_index));
		}, false);
		
		if(host.using){
			mi.setAttribute("checked",true);
		}
		return mi;
	};

	var mk_menu_gp_item = function(group_name, group_id, host_list){
		var mi = document.createElement("menuitem");
		mi.setAttribute("label", group_name.substr(0,35));
		mi.setAttribute("acceltext", "Group");
		mi.setAttribute("type","checkbox");
		mi.addEventListener("command", function(){
			save_alert(host_admin.group_toggle_and_save(host_list, group_id));
		}, false);
		if(host_admin.group_checked(host_list, group_id)){
			mi.setAttribute("checked",true);
		}
		return mi;
	};

	var editor_item = (function(){
			var mi = document.createElement("menuitem");
			mi.setAttribute("label", "Host Editor");

			mi.addEventListener("command", function(){
				opentab('EDITOR');
			}, false);
			return mi;
		})();

	// {{{ refresh menu
	var refresh_menu = function(){
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
				return function(){
						opentab("http://" + h);
					};
				})(h), false);

			sub.setAttribute("acceltext", h.charAt(0).toUpperCase());
			var popup = document.createElement("menupopup");
			sub.appendChild(popup);

			var hide = true;
			var addblock = {};
			// TODO clean up
			for (var i in hosts[h]){
				var host = hosts[h][i];

				if(host.hide){
					continue;
				}
				
				if(host.comment || !addblock[host.addr]){
					addblock[host.addr] = true;
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
		tosortKey = tosortKey.sort();
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
				menu.appendChild(document.createElement("menuseparator"));
			}
			hosts = hosts[curHost];
			var addblock = {};
			for (var i in hosts){
				if(!hosts[i].hide){
					if(hosts[i].comment || !addblock[hosts[i].addr]){
						addblock[hosts[i].addr] = true;
						menu.appendChild(mk_menu_item(curHost, hosts[i], i));
						hasCur = true;
					}
				}
			}
			if(!hasCur && hasOther){
				menu.removeChild(menu.lastChild);
			}
		}


		if(hasOther || hasCur){
			menu.insertBefore(document.createElement("menuseparator"), menu.firstChild);
		}
		menu.insertBefore(editor_item, menu.firstChild);
	};
	// }}} refresh menu
	

	var onclick = function(target, event){
		if(event.button && event.button !== 0) return false;

		host_admin.refresh();
		refresh_menu();

		var menu = document.getElementById("hostadmin-popup");

		menu.openPopup(target, "before_end", 0 ,0, true);
		return false;
	};

	var onload = function(event){
		
		var panel_label = document.getElementById("hostadmin-label");
		panel_label.addEventListener('mousedown', function(e) {
			onclick(panel_label, e);
		}, false);
		
		
		gBrowser.tabContainer.addEventListener("TabOpen", updatelb, false);
		gBrowser.tabContainer.addEventListener("TabSelect", updatelb, false);
		gBrowser.tabContainer.addEventListener("TabAttrModified", updatelb, false);

	};
	
	
	window.addEventListener("load", onload, false);

	event_host.addEventListener('HostAdminRefresh', function() {
		updatelb();
	}, false);

})(window.HostAdmin);

