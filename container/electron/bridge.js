(function(){
  if (!window.hostadminElectron) {
    return;
  }

  var inject = function(src, done){
    var el = document.createElement('script');
    el.onload = done;
    el.src = src;
    document.head.appendChild(el);
  };

  inject('../../core/init.js', function(){
    inject('../../container/electron/config.js', function(){
      inject('../../container/electron/host_file_wrapper.js', function(){
        inject('../../core/hostadmin.js', function(){
          inject('../../container/electron/timer.js', function(){
            inject('../../container/electron/container.js');
          });
        });
      });
    });
  });
})();
