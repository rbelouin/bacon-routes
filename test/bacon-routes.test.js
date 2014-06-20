describe("Bacon.history", function() {
  after(function() {
    History.pushState(null, null, window.location.origin);
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

    History.pushState(null, null, "?key=value");
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

    History.pushState(null, null, "?key2=value2");
    History.pushState(null, null, "?key3=value3");
  });
});

describe("Bacon.fromRoutes", function() {
  after(function() {
    History.pushState(null, null, window.location.origin);
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

    History.pushState(null, null, "/something");
    History.pushState(null, null, "/something/");
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

    History.pushState(null, null, "/musicians/dave-brubeck");
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

    History.pushState(null, null, "/musicians/dave-brubeck/songs/blue-rondo-%C3%A0-la-turk");
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

    History.pushState(null, null, "/b");
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

    History.pushState(null, null, "/c");
  });
});
