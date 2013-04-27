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
		if(line || line === 0){
			var e = HostAdmin.event_host.createEvent('CustomEvent');
			e.initCustomEvent('HostAdminReqCursorLine', false, false, { cursorline : line });
			HostAdmin.event_host.dispatchEvent(e);
		}
	}
})(window.HostAdmin);

