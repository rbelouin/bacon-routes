describe("Bacon.history", function() {
  afterEach(function() {
    Bacon.history.pushState(null, null, window.location.origin);
  });

  it("should contain the correct href at start", function(done) {
    Bacon.history.take(1).onValue(function(history) {
      expect(history.location.href).toBe(window.location.href);
      done();
    });
  });

  it("should contain the correct href after a pushState", function(done) {
    Bacon.history.skip(1).take(1).onValue(function(history) {
      expect(history.location.href).toBe(window.location.href);
      done();
    });

    Bacon.history.pushState(null, null, "?key=value");
  });

  it("should keep locations immutable through pushState", function(done) {
    var initialLocation;
    var initialHref;

    Bacon.history.skip(1).take(1).onValue(function(history) {
      initialLocation = history.location;
      initialHref = history.location.href;
    });

    Bacon.history.skip(2).take(1).onValue(function(history) {
      expect(initialLocation.href).toBe(initialHref);
      done();
    });

    Bacon.history.pushState(null, null, "?key2=value2");
    Bacon.history.pushState(null, null, "?key3=value3");
  });
});

describe("Bacon.fromRoutes", function() {
  afterEach(function() {
    Bacon.history.pushState(null, null, window.location.origin);
  });

  it("should define one stream per valid route", function() {
    var routes = Bacon.fromRoutes({
      routes: {
        "home": "/",
        "users": "/users",
        "invalid": null,
        "invalid2": {}
      }
    });

    expect(routes.home).toBeDefined();
    expect(routes.users).toBeDefined();
    expect(routes.invalid).toBeUndefined();
    expect(routes.invalid2).toBeUndefined();
  });

  it("should send the new history only to the first matching route", function(done) {
    var add = function(a, b) { return a + b; };

    var routes = Bacon.fromRoutes({
      routes: {
        "routeA": "/something",
        "routeB": "/something/"
      }
    });

    var s_called = Bacon.combineTemplate({
      routeA: routes.routeA.map(true).toProperty(false),
      routeB: routes.routeB.map(true).toProperty(false)
    });

    s_called.skip(2).take(1).onValue(function(called) {
      expect(called.routeA).toBe(true);
      expect(called.routeB).toBe(false);
      done();
    });

    Bacon.history.pushState(null, null, "/something");
    Bacon.history.pushState(null, null, "/something/");
  });

  it("should be able to extract a parameter from the given path", function(done) {
    var routes = Bacon.fromRoutes({
      routes: {
        "musician": "/musicians/:id"
      }
    });

    routes.musician.take(1).onValue(function(history) {
      expect(history.params.id).toBe("dave-brubeck");
      done();
    });

    Bacon.history.pushState(null, null, "/musicians/dave-brubeck");
  });

  it("should be able to URI-decode a parameter from the given path", function(done) {
    var routes = Bacon.fromRoutes({
      routes: {
        "song": "/musicians/:id/songs/:songId"
      }
    });

    routes.song.take(1).onValue(function(history) {
      expect(history.params.id).toBe("dave-brubeck");
      expect(history.params.songId).toBe("blue-rondo-à-la-turk");
      done();
    });

    Bacon.history.pushState(null, null, "/musicians/dave-brubeck/songs/blue-rondo-%C3%A0-la-turk");
  });

  it("should send the new history to the 'errors' stream if no route is matching", function(done) {
    var routes = Bacon.fromRoutes({
      routes: {
        a: "/a"
      }
    });

    routes.errors.take(1).onValue(function(history) {
      expect(history.location.pathname).toBe("/b");
      done();
    });

    Bacon.history.pushState(null, null, "/b");
  });

  it("should not send the new history to the 'errors' stream if a route is matching", function(done) {
    var routes = Bacon.fromRoutes({
      routes: {
        a: "/a",
        b: "/b",
        c: "/c"
      }
    });

    var s_called = Bacon.combineTemplate({
      c: routes.c.map(true).toProperty(false),
      errors: routes.errors.map(true).toProperty(false)
    });

    s_called.skip(1).take(1).onValue(function(called) {
      expect(called.c).toBe(true);
      expect(called.errors).toBe(false);
      done();
    });

    Bacon.history.pushState(null, null, "/c");
  });

  it("should not send the new history to the matching stream at start, by default", function(done) {
    var add = function(a, b) { return a + b; };

    Bacon.history.pushState(null, null, "/start");

    var routes = Bacon.fromRoutes({
      routes: {
        start: "/start",
        stop: "/stop"
      }
    });

    var s_counts = Bacon.combineTemplate({
      start: routes.start.map(1).scan(0, add),
      stop: routes.stop.map(1).scan(0, add)
    });

    s_counts.skip(1).take(1).onValue(function(counts) {
      expect(counts.start).toBe(0);
      expect(counts.stop).toBe(1);
      done();
    });

    Bacon.history.pushState(null, null, "/stop");
  });

  it("should send the new history to the matching stream at start, if a 'ready' property is given", function(done) {
    var add = function(a, b) { return a + b; };

    Bacon.history.pushState(null, null, "/start");

    var ready = new Bacon.Bus();

    var routes = Bacon.fromRoutes({
      ready: ready.map(true).toProperty(false),
      routes: {
        start: "/start",
        stop: "/stop"
      }
    });

    var s_counts = Bacon.combineTemplate({
      start: routes.start.map(1).scan(0, add),
      stop: routes.stop.map(1).scan(0, add)
    });

    s_counts.skip(2).take(1).onValue(function(counts) {
      expect(counts.start).toBe(1);
      expect(counts.stop).toBe(1);
      done();
    });

    ready.push();

    Bacon.history.pushState(null, null, "/stop");
  });
});
