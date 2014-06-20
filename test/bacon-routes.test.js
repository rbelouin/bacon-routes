describe("Bacon.history", function() {
  after(function() {
    History.pushState(null, null, window.location.pathname);
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
