// Backbone.SOS
// Distributed under MIT license
// http://github.com/hernantz/backbone.sos

;(function (root, factory) {
  "use strict";

  if (typeof exports === "object") {

    module.exports = factory(
      require("underscore"),
      require("backbone")
    );

  } else if (typeof define === "function" && define.amd) {

    define([
      "underscore",
      "backbone"
    ], factory);

  } else {

    factory(_, Backbone);

  }

}(this, function (_, Backbone) {
  "use strict";

  var opts = {
    "loadingEvents": ["request"], 
    "loadedEvents": ["sync", "error"]
  };

  var onRequest = function (obj) {
    obj.loading = true;
    obj.trigger("loading", obj);
  };

  var onResponse = function (obj) {
    obj.loading = false;
    if (!obj.loaded) obj.loaded = true;
    obj.trigger("loaded", obj);
  };

  var SOS = {
    track: function (obj, options) {
      options = _.extend(_.clone(opts), options);
      obj.loading = false;
      obj.loaded = false;
      obj.on(options.loadingEvents.join(" "), onRequest, obj);
      obj.on(options.loadedEvents.join(" "), onResponse, obj);
    },
    untrack: function (obj) {
      delete obj.loading;
      delete obj.loaded;
      obj.off(null, onRequest);
      obj.off(null, onResponse);
    },
    resetTracking: function (obj) {
        obj.loading = false;
        obj.loaded = false;
    }
  };

  Backbone.SOS = SOS;

  return Backbone.SOS;

}));
