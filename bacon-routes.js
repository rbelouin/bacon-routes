(function() {
  var cloneLocation = function(location) {
    var result = {};

    for(var key in location) {
      result[key] = location[key];
    }

    return result;
  };

  var s_history = Bacon.fromBinder(function(sink) {
    var subscribed = true;

    History.Adapter.bind(window, "statechange", function() {
      if(subscribed) {
        sink({
          state: History.getState(),
          location: cloneLocation(window.location)
        });
      }
    });

    return function() {
      subscribed = false;
    };
  });

  History.pushState(null, null, window.location.href);

  Bacon.history = s_history.toProperty({
    state: History.getState(),
    location: cloneLocation(window.location)
  });
})();
