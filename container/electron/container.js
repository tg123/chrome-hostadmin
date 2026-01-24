;(function(HostAdmin){
  var opentab = function(t, line){
    if (t === 'PERMHELP') {
      window.open(HostAdmin.PERM_HELP_URL);
    }
    if (typeof line === 'number') {
      HostAdmin.cursorline = line;
      HostAdmin.requestCursorLine(line);
    }
  };

  HostAdmin.container = {
    opentab: opentab,
    curhost: function(){ return ''; }
  };
})(window.HostAdmin);
