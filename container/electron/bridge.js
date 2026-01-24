(function(){
  if (!window.hostadminElectron) {
    return;
  }

  var inject = function(src){
    document.write('<script src="' + src + '"><\\/script>');
  };

  inject('../../core/init.js');
  inject('../../container/electron/config.js');
  inject('../../container/electron/host_file_wrapper.js');
  inject('../../core/hostadmin.js');
  inject('../../container/electron/timer.js');
  inject('../../container/electron/container.js');
})();
