// HostAdmin
// by T.G.(farmer1992@gmail.com)
//
// MPL v2
// http://code.google.com/p/fire-hostadmin/
window.HostAdmin = {};

// event and cursor
(function(HostAdmin){
	HostAdmin.event_host = document;

	HostAdmin.requestCursorLine = function(line){
		if(line){
			var e = HostAdmin.event_host.createEvent('Events');
			e.initEvent('HostAdminReqCursorLine', false, false);
			e.cursorline = line;
			HostAdmin.event_host.dispatchEvent(e);
		}
	}
})(window.HostAdmin);

