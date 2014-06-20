(function() {
  var cloneLocation = function(location) {
    var result = {};

    for(var key in location) {
      result[key] = location[key];
    }

    return result;
  };

  var cloneObject = function(object) {
    var result = {};

    for(var key in object) {
      if(object.hasOwnProperty(key)) {
        result[key] = object[key];
      }
    }

    return result;
  };

  var flatten = function(array) {
    if(typeof array.filter == "function") {
      return array.filter(function(item) {
        return item;
      });
    }
    else {
      var result = [];

      for(var i = 0, l = array.length; i < l; i++) {
        if(array[i]) {
          result.push(array[i]);
        }
      }

      return result;
    }
  };

  var compareSegments = function(routeSegments) {
    return function(pathSegments) {
      if(routeSegments.length != pathSegments.length) {
        return null;
      }
      else {
        var params = {};

        for(var i = 0, l = routeSegments.length; i < l; i++) {
          if(routeSegments[i][0] == ":") {
            params[routeSegments[i].substring(1)] = decodeURIComponent(pathSegments[i]);
          }
          else if(routeSegments[i] != pathSegments[i]) {
            return null;
          }
        }

        return params;
      }
    };
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

  Bacon.fromRoutes = function(settings) {
    settings.routes = settings.routes || {};

    var routes = {};
    var buses = {};
    var streams = {};
    var filters = {};

    for(var name in settings.routes) {
      if(settings.routes.hasOwnProperty(name) && typeof settings.routes[name] == "string") {
        routes[name] = flatten(settings.routes[name].split("/"));

        buses[name] = new Bacon.Bus();
        filters[name] = compareSegments(routes[name]);

        /* Prevent final user to push any data in the returned streams */
        streams[name] = buses[name].map(function(value) { return value; });
      }
    }

    Bacon.history.onValue(function(history) {
      var pathSegments = flatten(history.location.pathname.split("/"));

      for(var name in buses) {
        if(buses.hasOwnProperty(name)) {
          var params = filters[name](pathSegments);

          if(params) {
            var result = cloneObject(history);
            result.params = params;

            buses[name].push(result);
            break;
          }
        }
      }
    });

    return streams;
  };
})();
