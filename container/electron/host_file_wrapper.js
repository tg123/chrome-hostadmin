;(function(HostAdmin){
  var api = window.hostadminElectron;
  var splitchar = (navigator.platform && navigator.platform.toLowerCase().indexOf('win') >= 0) ? '\r\n' : '\n';

  HostAdmin.host_file_wrapper = {
    get: function(){
      var result = api.get();
      if (result && result.error) {
        return '';
      }
      return result;
    },
    set: function(data){
      if (splitchar === '\r\n') {
        data = data.replace(/\r?\n/g, '\r\n');
      }
      var result = api.set(data);
      if (result && result.error) {
        return false;
      }
      return result;
    },
    time: function(){
      var result = api.time();
      if (result && result.error) {
        return 0;
      }
      return result;
    },
    splitchar: splitchar
  };
})(window.HostAdmin);
