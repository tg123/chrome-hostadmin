// HostAdmin
// by T.G.(farmer1992@gmail.com)
//
// file wrapper module 
// enable hostadmin read and set hosts file
//
(function(HostAdmin){

	// copy from io.js
	// http://kb.mozillazine.org/Dev_:_Extensions_:_Example_Code_:_File_IO_:_jsio
	var FileIO = {

		localfileCID  : '@mozilla.org/file/local;1',
		localfileIID  : Components.interfaces.nsIFile,

		finstreamCID  : '@mozilla.org/network/file-input-stream;1',
		finstreamIID  : Components.interfaces.nsIFileInputStream,

		foutstreamCID : '@mozilla.org/network/file-output-stream;1',
		foutstreamIID : Components.interfaces.nsIFileOutputStream,

		sinstreamCID  : '@mozilla.org/scriptableinputstream;1',
		sinstreamIID  : Components.interfaces.nsIScriptableInputStream,

		suniconvCID   : '@mozilla.org/intl/scriptableunicodeconverter',
		suniconvIID   : Components.interfaces.nsIScriptableUnicodeConverter,

		open   : function(path) {
			try {
				var file = Components.classes[this.localfileCID]
								.createInstance(this.localfileIID);
				file.initWithPath(path);
				return file;
			}
			catch(e) {
				return false;
			}
		},

		read   : function(file, charset) {
			try {
				var data     = new String();
				var fiStream = Components.classes[this.finstreamCID]
									.createInstance(this.finstreamIID);
				var siStream = Components.classes[this.sinstreamCID]
									.createInstance(this.sinstreamIID);
				fiStream.init(file, 1, 0, false);
				siStream.init(fiStream);
				data += siStream.read(-1);
				siStream.close();
				fiStream.close();
				if (charset) {
					data = this.toUnicode(charset, data);
				}
				return data;
			} 
			catch(e) {
				return false;
			}
		},

		write  : function(file, data, mode, charset) {
			try {
				var foStream = Components.classes[this.foutstreamCID]
									.createInstance(this.foutstreamIID);
				if (charset) {
					data = this.fromUnicode(charset, data);
				}
				var flags = 0x02 | 0x08 | 0x20; // wronly | create | truncate
				if (mode == 'a') {
					flags = 0x02 | 0x10; // wronly | append
				}
				foStream.init(file, flags, 0664, 0);
				foStream.write(data, data.length);
				// foStream.flush();
				foStream.close();
				return true;
			}
			catch(e) {
				return false;
			}
		},

		create : function(file) {
			try {
				file.create(0x00, 0664);
				return true;
			}
			catch(e) {
				return false;
			}
		},

		unlink : function(file) {
			try {
				file.remove(false);
				return true;
			}
			catch(e) {
				return false;
			}
		},

		path   : function(file) {
			try {
				return 'file:///' + file.path.replace(/\\/g, '\/')
							.replace(/^\s*\/?/, '').replace(/\ /g, '%20');
			}
			catch(e) {
				return false;
			}
		},

		toUnicode   : function(charset, data) {
			try{
				var uniConv = Components.classes[this.suniconvCID]
									.createInstance(this.suniconvIID);
				uniConv.charset = charset;
				data = uniConv.ConvertToUnicode(data);
			} 
			catch(e) {
				// foobar!
			}
			return data;
		},

		fromUnicode : function(charset, data) {
			try {
				var uniConv = Components.classes[this.suniconvCID]
									.createInstance(this.suniconvIID);
				uniConv.charset = charset;
				data = uniConv.ConvertFromUnicode(data);
				// data += uniConv.Finish();
			}
			catch(e) {
				// foobar!
			}
			return data;
		}

	};

	var fire_config = HostAdmin.config;

	var host_file_wrapper = (function(){	
		const os = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
		var splitchar = "\n";

	
		var file_names = [];

		fire_config.run_when_not_equal("hostsfilepath", "default", function(configpath){
			file_names.push(configpath);
		});
	
		if (os == "WINNT"){
			splitchar = "\r\n";
			try {
				var winDir = Components.classes["@mozilla.org/file/directory_service;1"].
				getService(Components.interfaces.nsIProperties).get("WinD", Components.interfaces.nsIFile); 
				file_names.push(winDir.path + "\\system32\\drivers\\etc\\hosts");
			}
			catch (err) {}

			file_names.push("C:\\windows\\system32\\drivers\\etc\\hosts");
		}else if(os == "Linux"){
			file_names.push("/etc/hosts");
		}else if(os == "Darwin"){
			file_names.push("/etc/hosts");
		}

		var file_name;
		for(var i in file_names){
			file_name = file_names[i];
			var _f = FileIO.open(file_name);
			if(_f && _f.exists()){
				break;
			}
		}
	
		var charset = "utf8"; // null means auto

		// detect using jschardet
		// but maybe unqualified
		if(!charset){
			// -- temp for windows before charset detector
			if (os == "WINNT"){
				charset = 'gbk';
			}

			//var file = FileIO.open(file_name);
			//charset = jschardet.detect(FileIO.read(file));
			//charset = charset ? charset.encoding : "utf8";
		}

		fire_config.run_when_not_equal("charset", "auto", function(c){
			charset = c;
		});

		return {
			get : function(){
				var file = FileIO.open(file_name);
				return FileIO.read(file, charset);
			}
			,
			set : function(data){
				if (os == "WINNT"){
					data = data.replace(/([^\r])\n/g, "$1\r\n");
				}

				var file = FileIO.open(file_name);
				return FileIO.write(file, data, '', charset);
			}
			,
			time : function(){
				var file = FileIO.open(file_name);
				return file.lastModifiedTime;
			}
			,
			splitchar : splitchar
		};
	})();
	
	HostAdmin.host_file_wrapper  = host_file_wrapper;
})(window.HostAdmin);
