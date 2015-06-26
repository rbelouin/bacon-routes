(function() {

  /*
   * Utils
   * Let's start by defining some useful functions
   */
  var Utils = {};

  /*
   * Utils.cloneObject
   * Create an immutable copy of a given object
   */
  Utils.cloneObject = function(object) {
    var result = {};

    for(var key in object) {
      if(object.hasOwnProperty(key)) {
        result[key] = object[key];
      }
    }

    return result;
  };

  /*
   * Utils.cloneLocation
   * Create an immutable copy of window.location
   */
  Utils.cloneLocation = function() {
    var result = {};
    var loc = window.location;

    /* None of window.location keys is owned by window.location, so no check here */
    for(var key in loc) {
      result[key] = loc[key];
    }

    return result;
  };

  /*
   * Utils.compact
   * Remove "falsey" values from a given array
   */
  Utils.compact = function(array) {
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

  /*
   * Utils.extractParams
   * Return path parameters if the given splitted path does match the given splitted route. Return null otherwise.
   * ex: Utils.extractParams(["users", ":userId"])(["users", "john-smith"]) => {"userId": "john-smith"}
   */
  Utils.extractParams = function(routeSegments) {
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

  /*
   * s_history
   * Stream emitting history states
   */
  var s_historyBus = new Bacon.Bus();
  var s_history = Bacon.fromEventTarget(window, "popstate").merge(s_historyBus).map(function() {
    return {
      state: history.state,
      location: Utils.cloneLocation()
    };
  });

  /*
   * Bacon.history
   * Create a bacon property of the history state
   */
  Bacon.history = s_history.toProperty({
    state: history.state,
    location: Utils.cloneLocation()
  });

  Bacon.history.pushState = function(stateObj, title, url) {
    history.pushState(stateObj, title, url);
    s_historyBus.push();
  };

  /* Push the initial state */
  Bacon.history.pushState(null, null, window.location.href);

  /*
   * Bacon.fromRoutes
   * Return one bacon stream per defined route
   */
  Bacon.fromRoutes = function(settings) {
    settings.routes = settings.routes || {};

    var ready = (settings.ready || Bacon.constant(true)).toEventStream().skipWhile(function(value) {
      return value !== true;
    }).take(1);

    var routes = {};
    var buses = {};
    var streams = {};
    var filters = {};

    for(var name in settings.routes) {
      if(settings.routes.hasOwnProperty(name) && typeof settings.routes[name] == "string") {
        routes[name] = Utils.compact(settings.routes[name].split("/"));

        buses[name] = new Bacon.Bus();
        filters[name] = Utils.extractParams(routes[name]);

        /* Prevent final user to push any data in the returned streams */
        streams[name] = buses[name].map(function(value) { return value; });
      }
    }

    /* Dedicate "errors" stream to 404 occurences */
    var s_errors = new Bacon.Bus();
    streams.errors = s_errors.map(function(value) { return value; });

    ready.onValue(function(value) {
      Bacon.history.onValue(function(history) {
        var pathSegments = Utils.compact(history.location.pathname.split("/"));
        var result = Utils.cloneObject(history);

        for(var name in buses) {
          if(buses.hasOwnProperty(name)) {
            var params = filters[name](pathSegments);

            if(params) {
              result.params = params;

              buses[name].push(result);
              return;
            }
          }
        }

        s_errors.push(result);
      });
    });

    return streams;
  };

})();
