// HostAdmin
// by T.G.(farmer1992@gmail.com)
//
// core module 
// implentment of hostadmin syntax
// http://code.google.com/p/fire-hostadmin/wiki/HOST_SYNTAX
//
(function(HostAdmin){
	
	var host_file_wrapper = HostAdmin.host_file_wrapper;
	var event_host = HostAdmin.event_host;

	var host_admin = (function(){
		var ip_regx = /^((1?\d?\d|(2([0-4]\d|5[0-5])))\.){3}(1?\d?\d|(2([0-4]\d|5[0-5])))$/;

		// copy from http://forums.intermapper.com/viewtopic.php?t=452
		var ip6_regx = /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?$/ ;

		var lines = [];
		var hosts = {};
		var groups = {};
		var hostname_withoutcase = {};

		var cur_host_content = "";
		
		var loadhost = function() {
		
			lines = [];
			hosts = {};
			groups = {};
			hostname_withoutcase = {};
			//read
			var host = host_file_wrapper.get();
			cur_host_content = host;
			
			if (host && host.charAt(host.length - 1) != "\n"){ //fix no lf
				host += host_file_wrapper.splitchar;
			}

			var l_p = 0; //pointer to line
			var regx = /(.*?)\r?\n/mg;
			var group_id = 0;
			var group_c = 0;
			var ingroup = false;
			var bulk_hide = false;
			var group_hided = {};

			while(true){
				var l = regx.exec(host);
				if(!l){
					break;
				}

				var i;
				l = l[0];
				
				lines[l_p++] = l;

				l = l.replace(/^(\s*#)+/,"#");
				l = l.replace(/#/g," # ");
				l = l.replace(/^\s+|\s+$/g,"");
				l = l.replace(/\s+/g," ");
				
				var tks = l.split(" ");

				if (tks[0] == "#" && tks[1] == "===="){
					if(group_c === 0){
						group_id++;
					}

					if(group_c++ % 2 === 0){
						tks.splice(0,2);
						var group_name = "";
						for(i in tks){
							group_name += tks[i] + " ";
						}

						if( tks[i-1] === "#" && tks[i].toUpperCase() == 'HIDE' ){
							group_hided[group_id] = true;
						}

						if(group_name === ""){
							group_name = "Group " + group_id;
						}

						groups[group_id] = group_name;
						ingroup = true;
					}else{
						ingroup = false;
						group_id++;
					}
					continue;	

				} else if (tks[0] == "#" && tks[1] && tks[1].toUpperCase() == "HIDE_ALL_OF_BELOW"){
					bulk_hide = true;
				}
							
				var using = true;
				if (tks[0] == "#"){
					using = false;
					tks.splice(0,1);
				}
				
				var ip = "";
				if (ip_regx.test(tks[0]) || ip6_regx.test(tks[0])){
					ip = tks[0];
					tks.splice(0,1);
				}else{
					continue;
				}
				
				var comment = "";

				var names = [];
				var findc = false;
				var findhide = false;
				for (i in tks){
					if(tks[i] == "#"){
						findc = true;
						continue;
					}

					findhide = tks[i].toUpperCase() == 'HIDE'
					
					if(findc){
						comment += tks[i] + " ";
					}else{
						names.push(tks[i]);
					}
				}

				if(typeof(comment) == "string"){
					comment = comment.replace(/^\s+|\s+$/g, '');
				}

				ip = {
					addr : ip, 
					using : using ,
					line : l_p - 1,
					comment : comment,
					group : ingroup ? group_id : 0,
					hide : bulk_hide || findhide || (ingroup && group_hided[group_id] === true)
				};
	
				for (i in names){
					var name = names[i];
					if(typeof hosts[name] == "undefined"){
						hosts[name] = [];
					}
				
					hosts[name].push(ip);
					hostname_withoutcase[name.toUpperCase()] = name;
				}
			}
		};
		
		var line_enable = function(ip){
			if(!ip.using){
				lines[ip.line] = lines[ip.line].replace(/^(\s*#)+/,"");
			}
			ip.using = true;
		};

		var line_disable = function(ip){
			if(ip.using){
				lines[ip.line] = "#" + lines[ip.line];
			}
			ip.using = false;
		};

		var host_toggle = function(host_name, ip_p){
			if(hosts[host_name]){
				var addr = hosts[host_name][ip_p].addr;
				var using = hosts[host_name][ip_p].using;
				for (var i in hosts[host_name]){
					var ip = hosts[host_name][i];
					
					if(ip.addr == addr && !using){
						line_enable(ip);
					}else{
						line_disable(ip);
					}
				}
			}
		};

		var is_group_all_using = function(host_list, gp_p){
			for(var h in host_list){
				for (var i in hosts[host_list[h]]){
					var ip = hosts[host_list[h]][i];
					if(ip.group == gp_p && !ip.using){
						return false;
					}
				}
			}
			return true;
		};

		var group_toggle = function(host_list, gp_p){
			var using = is_group_all_using(host_list, gp_p);
			
			for(var h in host_list){
				for (var i in hosts[host_list[h]]){
					var ip = hosts[host_list[h]][i];
					
					if(ip.group == gp_p){
						if(using){
							line_disable(ip);
						}else{
							line_enable(ip);
						}
					}else if(ip.using){
						line_disable(ip);
					}
				}
			}
		};

		var mk_host = function(){
			var str = "";
			for (var i in lines){
				str += lines[i];
			}
			return str;
		};
		
		var last_modify = 0;
		
		// {{{		

		var disp_refresh_event = function(){
			var e = event_host.createEvent('Events');
			e.initEvent('HostAdminRefresh', false, false);
			event_host.dispatchEvent(e);
		};
		
		var last_host_content;
		var refresh = function(){
			var t = host_file_wrapper.time();
			
			if( t != last_modify){
				loadhost();

				if(last_host_content != cur_host_content){
					// prevent from saving failed cause editor refresh
					last_host_content = cur_host_content;
					disp_refresh_event();
				}

				last_modify = t;

				return true;
			}
			return false;
		};
		// }}}
		
		return {
			get_hosts : function(){
				return hosts;
			},
			get_groups : function(){
				return groups;
			},
			host_toggle : host_toggle,
			group_toggle : group_toggle,
			group_checked : is_group_all_using,
			// mk_host : mk_host,

			host_toggle_and_save : function(host_name, ip_p){ 
				host_toggle(host_name, ip_p);
				return this.save();
			} ,
			group_toggle_and_save : function(host_list, gp_p){
				group_toggle(host_list, gp_p);
				return this.save();
			},
			save : function(hoststr){
				if(!hoststr){ hoststr = mk_host();}

				var succ = host_file_wrapper.set(hoststr);
				
				last_modify = 0;
				this.refresh();
				return succ;
			},

			load : function(){
				return cur_host_content;
			},

			refresh : refresh,

			real_hostname: function(hostname){
				if(hostname) return hostname_withoutcase[hostname.toUpperCase()];
			}
			
		};
		
	})();

	HostAdmin.core = host_admin;
	HostAdmin.PERM_HELP_URL = 'http://code.google.com/p/fire-hostadmin/wiki/GAIN_HOSTS_WRITE_PERM';
})(window.HostAdmin);

