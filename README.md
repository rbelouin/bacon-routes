# bacon-routes [![Build Status](https://travis-ci.org/rbelouin/bacon-routes.svg?branch=master)](https://travis-ci.org/rbelouin/bacon-routes)

Route management, the bacon.js way.

Install
-------

```sh
bower install --save bacon-routes
```

Intro
-----

Bacon.js is a library for functional reactive programming, you can get more information about it on the [github project webpage](https://github.com/baconjs/bacon.js).

The idea here is to handle history states and manage client-side routing using Bacon.js.

API
---

`Bacon.history` is a reactive property handling history changes.

Example:

```js
Bacon.history.onValue(function(history) {
  console.log(history);
});

/* Prints:
  {
    "state": [history forwarded from popstate],
    "location": [window.location]
  }
*/
```

`Bacon.history` provides a `pushState` method in order to trigger the load of a URL. See the related [MDN article](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history#The_pushState%28%29_method) for further documentation.

```js
  Bacon.history.pushState(null, null, "/some-path/some-param");
```

`Bacon.fromRoutes` is a method creating streams for each given route.

Example:

```js
var routes = Bacon.fromRoutes({
  routes: {
    "users":  "/users",
    "user":   "/users/:id"
  }
});

/* Log history */
routes.users.onValue(function(history) {
  console.log(history);
});

/* Log user id */
routes.user.map(function(history) {
  return history.params.id;
}).log();
```

By default, no event is sent until the next url change. To send an event at start, use a `ready` property:

```js
var ready = new Bacon.Bus();
var routes = Bacon.fromRoutes({
  ready: ready.map(true).toProperty(false),
  routes: {
    "users":  "/users",
    "user":   "/users/:id"
  }
});

/* Log history */
routes.users.onValue(function(history) {
  console.log(history);
});

/* Log user id */
routes.user.map(function(history) {
  return history.params.id;
}).log();

ready.push("Stream subscribers are ready, sir!");
```
