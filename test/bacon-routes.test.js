var Bacon = window.Bacon = require("baconjs");
require("../bacon-routes.js");

describe("Bacon.history", function() {
  after(function() {
    Bacon.history.pushState(null, null, window.location.origin);
  });

  it("should contain the correct href at start", function(done) {
    Bacon.history.take(1).onValue(function(history) {
      assert.equal(history.location.href, window.location.href, "Actual location does not equal the expected location");
      done();
    });
  });

  it("should contain the correct href after a pushState", function(done) {
    Bacon.history.skip(1).take(1).onValue(function(history) {
      assert.equal(history.location.href, window.location.href, "Actual location does not equal the expected location");
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
      assert.equal(initialLocation.href, initialHref, "Initial location did not keep the initial href value");
      done();
    });

    Bacon.history.pushState(null, null, "?key2=value2");
    Bacon.history.pushState(null, null, "?key3=value3");
  });
});

describe("Bacon.fromRoutes", function() {
  after(function() {
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

    assert.isObject(routes.home);
    assert.isObject(routes.users);
    assert.isUndefined(routes.invalid);
    assert.isUndefined(routes.invalid2);
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
      assert.isTrue(called.routeA);
      assert.isFalse(called.routeB);
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
      assert.equal(history.params.id, "dave-brubeck");
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
      assert.equal(history.params.id, "dave-brubeck");
      assert.equal(history.params.songId, "blue-rondo-à-la-turk");
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
      assert.equal(history.location.pathname, "/b");
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
      assert.isTrue(called.c);
      assert.isFalse(called.errors);
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
      assert.equal(counts.start, 0, "/start has been called " + counts.start + " time(s).");
      assert.equal(counts.stop, 1, "/stop has been called " + counts.stop + " time(s).");
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
      assert.equal(counts.start, 1, "/start has been called " + counts.start + " time(s).");
      assert.equal(counts.stop, 1, "/stop has been called " + counts.stop + " time(s).");
      done();
    });

    ready.push();

    Bacon.history.pushState(null, null, "/stop");
  });
});
