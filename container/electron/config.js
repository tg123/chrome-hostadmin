(function(HostAdmin){
  var memory = {};

  HostAdmin.config = {
    set: function(key, value){
      if (window.localStorage) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        memory[key] = value;
      }
    },
    get: function(key){
      if (window.localStorage) {
        return JSON.parse(localStorage.getItem(key));
      }
      return memory[key];
    }
  };
})(window.HostAdmin);
