requirejs.config({

  baseUrl: "node_modules/",

  paths: {
    "jquery": "jquery/dist/jquery",
    "sinon": "sinon/lib/sinon",
    "underscore": "underscore/underscore",
    "backbone": "backbone/backbone",
    "backbone.sos": "../backbone.sos",
    "marionette": "backbone.marionette/lib/backbone.marionette",
    "bootstrap": "bootstrap/dist/js/bootstrap" 
  },

  shim: {
    "bootstrap": {"deps": ["jquery"]}
  }

});


require([
  "jquery",
  "sinon",
  "marionette",
  "underscore",
  "backbone",
  "backbone.sos",
  "bootstrap"
], function ($, sinon, Marionette, _, Backbone) {
  var server = sinon.fakeServer.create();
  server.autoRespond = true;
  server.autoRespondAfter = 1000;
  server.respondWith("POST", /comments/, function (xhr, id) {
    if ($("#simulate").prop("checked")) {
      xhr.respond(500, {"Content-Type": "application/json"}, "An error occurred, please try later.");
    } else {
      xhr.respond(200, {"Content-Type": "application/json"}, xhr.requestBody);
    }
  });

  server.respondWith("GET", /comments/, function (xhr, id) {
    if ($("#simulate").prop("checked")) {
      xhr.respond(500, {"Content-Type": "application/json"}, "An error occurred, please try later.");
    } else {
      var resp = [];
      if (xhr.url.indexOf("empty") === -1) {
        resp.push({ "id": 1, "nickname": "Merrick Jason", "comment": "Hey there", "img": "http://lorempixel.com/output/cats-q-c-100-100-8.jpg" });
        resp.push({ "id": 2, "nickname": "Sheila P. Glass", "comment": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam sapien sapien, efficitur ut odio a, blandit rutrum lacus. Nunc ut mauris nisi.", "img": "http://lorempixel.com/output/cats-q-c-100-100-4.jpg"});
      }
      xhr.respond(200, {"Content-Type": "application/json"}, JSON.stringify(resp));
    }
  });

  var Comment = Backbone.Model.extend({
    url: "/comments/",
    defaults: {
      "nickname": "",
      "comment": "",
      "img": ""
    },
    validate: function(attrs, options) {
      if (!attrs.comment) {
        return "Comment text is required.";
      }
    }
  });

  var Comments = Backbone.Collection.extend({
    url: "/comments/",
    initialize: function () {
      Backbone.SOS.track(this);
    }
  });

  var NewCommentController = Marionette.Object.extend({
    initialize: function (options) {
      this.el = options.el;
      this.collection = options.collection;
      this.view = null;
    },
    setupView: function () {
      if (this.model) {
        this.collection.add(this.model);
      }

      if (this.view) {
        this.view.destroy();
      }

      this.model = new Comment;
      Backbone.SOS.track(this.model);
      this.listenTo(this.model, 'sync', this.setupView);
      this.view = new NewCommentView({"model": this.model, "template": "#tpl-add-new"})
      this.el.html(this.view.render().el);
    }
  });

  var NewCommentView = Marionette.ItemView.extend({
    attributes: {
      "class": "col-md-12 add-comment"
    },
    events: {
      'click .btn': 'onSubmit'
    },
    modelEvents: {
      'loading': 'render',
      'error': 'onError',
      'invalid': 'onInvalid'
    },
    onError: function (model, resp, options) {
      this.errors = resp.responseText;
      this.render();
    },
    onInvalid: function (model, error, options) {
      this.errors = error;
      this.render();
    },
    onSubmit: function (event) {
      event.preventDefault();
      this.errors = null;
      this.model.set({
        "nickname": "anonymous", 
        "comment": this.$("textarea").val(),
        "img": "http://lorempixel.com/output/cats-q-c-100-100-1.jpg"
      });
      this.model.save();
    },
    serializeData: function () {
      var ctx = {
        "errors": this.errors,
        "loading": this.model.loading
      };
      return _.extend(ctx, this.model.toJSON());
    }

  });

  var EmptyView = Marionette.ItemView.extend({
    template: "#tpl-empty",
    tagName: "p",
    attributes: {
      "class": "text-center"
    }
  });

  var LoadingView = Marionette.ItemView.extend({
    template: "#tpl-loading",
    attributes: {
      "class": "row"
    }
  });

  var CommentView = Marionette.ItemView.extend({
    template: "#tpl-comment",
    attributes: {
      "class": "row"
    }
  });

  var CommentsFeedView = Marionette.CollectionView.extend({
    childView: CommentView,
    collectionEvents: {
      'sync loading': 'render',
      'error': 'onError'
    },
    onError: function (model, resp, options) {
      this.errors = resp.responseText;
      this.render();
    },
    onBeforeRender: function () {
      this.$el.empty();
    },
    getEmptyView: function() {
      if (this.collection.loading) {
        return LoadingView;
      }
      return EmptyView; 
    },
    onRender: function () {
      this.$el.removeClass('traslucid');
      if (this.collection.length && this.collection.loading) {
        this.$el.addClass('traslucid');
      }
    }
  });

  var comments = new Comments;
  window.comments = comments;

  $(function () {
    comments.fetch();
    new NewCommentController({"collection": comments, "el": $("#add-comment")}).setupView();
    new CommentsFeedView({"collection": comments, "el": $("#comments")}).render();
    $("#clear").on('click', function (event) {
      event.preventDefault();
      comments.reset();
    });
    $("#retrieve").on('click', function (event) {
      event.preventDefault();
      comments.fetch();
    });
    $("#no-retrieve").on('click', function (event) {
      event.preventDefault();
      comments.fetch({"data": {"empty": true}});
    });
  });
});
