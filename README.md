Backbone SOS
============

Sometimes you need to know whether a model/collection is interacting with the
server or not. Backbone SOS (State Of Sync) can help you track this in a very
decoupled way, by keeping the loading state where it belongs (inside your
models and collections).

One clear use case is that now you can write views that "react" accondingly to
the loading state of your data, and make your app feel snappier.
[Check a demo here](http://hernantz.github.io/backbone.sos/).

![Backbone.SOS in action](http://i.giphy.com/l0O9xpyfJDCPYeLq8.gif)

## Dependencies and setup
Backbone (v1.0 onwards) is the only dependency. Include `backbone.sos.js` or
`backbone.sos.min.js` after Backbone. Alternatively Backbone.SOS can be used as
an AMD (Requirejs) module as well as a regular CommonJS module.

You can fetch the latest stable version using bower or npm:
```bash
bower install backbone.sos  # using bower
npm install backbone.sos    # using npm
```

## Tracking models and collections
Backbone.SOS listens for `request` events on tracked models and collections to
set the `loading` state to `true`, meaning that the object started a request to
the server (on a fetch, save, create, etc). When the `sync` or `error` events
are triggered, the server has responded, and the `loading` state is set to
`false`.

### Tracking a single instance
```javascript
// Tracking a single model instance
var model = new Backbone.Model;
Backbone.SOS.track(model);

// Tracking a single collection instance
var collection = new Backbone.Collection;
Backbone.SOS.track(collection);
```

### Tracking all instances
```javascript
var MyModel = Backbone.Model.extend({
  initialize: function () {
    Backbone.SOS.track(this);
  }
});


var MyCollection = Backbone.Collection.extend({
  initialize: function () {
    Backbone.SOS.track(this);
  }
});
```

## The *loading* property
Backbone.SOS sets a new property `loading` on the objects you track. The value
of this property is tracked by Backbone.SOS, and can be either `true` or
`false` depending on the state of the request/response cycle the object
currently is.
By default, as tracked models and collections are set to be *loaded*, which
means that the `loading` property is initialized as `false`.

```javascript
var model = new Backbone.Model;
Backbone.SOS.track(model);
console.log(model.loading);         // prints: false
model.save({foo: "bar"});
console.log(model.loading);         // prints: true
// later, once the server responded...
console.log(model.loading);         // prints: false


var collection = new MyCollection;  // as defined above
console.log(collection.loading);    // prints: false
collection.fetch();
console.log(collection.loading);    // prints: true
// later, once the server responded...
console.log(collection.loading);    // prints: false
```

## The *loaded* property
This property will be set after the tracked object be fetched at least once.
As *loading* property, *loaded* property is also a Boolean one. In case the
model/collection has been never synchronized, the property value will be false.

```javascript
Backbone.SOS.track(model);
console.log(model.loaded);         // prints: false
model.save({foo: "bar"});
/ Before server responds.
console.log(model.loaded);         // prints: false
// later, once the server responded...
console.log(model.loaded);         // prints: true


var collection = new MyCollection;  // as defined above
console.log(collection.loaded);    // prints: false
collection.fetch();
// later, once the server responded...
console.log(collection.loaded);    // prints: true
```



## The *loading* and *loaded* events
Objects being tracked by Backbone.SOS will emit a `loading` signal when the
`loading` property is set to `true`, and a `loaded` signal when that property
is set to `false`, except when this property is initialized.
On both cases the tracked object is passed as a param to the signal callback.
This tip is useful since events on models propagate to the collections they are
contained in, so you could attach a callback to the `loading` and `loaded`
events for different models on the collection that contains them.

```javascript
var MyModel = Backbone.Model.extend({
  initialize: function () {
    Backbone.SOS.track(this);
  }
});

var fst = new MyModel,
    snd = new MyModel;

var collection = new Backbone.Collection([fst, snd]);

collection.on("loading", function (model) {
  // do something interesting here
});

collection.on("loaded", function (model) {
  // do something interesting here
});
```


## The resetTracking method
This method is useful when, for some reason, you need to reset *loading* and
*loaded* properties. Calling this method both properties will be set to *false*.
```javascript
Backbone.SOS.track(model);
console.log(model.loaded);         // prints: false
model.save({foo: "bar"});
// Before server responds.
console.log(model.loading);         // prints: true
console.log(model.loaded);         // prints: false
// later, once the server responded...
console.log(model.loading);         // prints: false
console.log(model.loaded);         // prints: true
Backbone.SOS.resetTracking(model);
console.log(model.loading);         // prints: false
console.log(model.loaded);         // prints: false
```


## Simple view example
This is a simple example to show how it comes to be useful to know the state of
sync of your data. Check for a more realistic example on the demo folder.

```javascript
var EditUsernameView = Backbone.View.extend({
  events: {
    'click .save': 'onSave'
  },
  onSave: function (event) {
    event.preventDefault();
    if (!this.model.loading) {
      this.model.save({username: this.$('.username').val()});
    } else {
      alert('Whoa! hold on!');
    }
  }
});
```

## Caveats
Because Backbone handles events like a FIFO (the first to hook for a signal is
the first to listen to it), you want the callbacks that alter the state of your
data to be called before your views can render that state. Generally, the best
place to setup these callbacks is the `initialize` method of your models and
collections. In other words, try to track your models/collections as early as
possible, ie. in their initialize methods, otherwise you could be reacting to
events or rendering your models/collections before they are marked as `loading`
or `loaded`.

```javascript
// Here model will trigger sync and doSomething() will still perceive
// `model.loading` as `true` when it should be `false` since it just sync'ed.
model.on("sync", doSomething);
// will hook to "sync" signal, but doSomething is called first
Backbone.SOS.track(model);
// loading = true
model.fetch();
```

The `track()` method assumes `loading = false` by default, so if the model had
started a request/response cycle, before it started being tracked by
Backbone.SOS, the `loading` property will not reflect the real state of sync.

```javascript
model.fetch();
Backbone.SOS.track(model);
console.log(model.loading); // prints false, even if the fetching is still ongoing
```
