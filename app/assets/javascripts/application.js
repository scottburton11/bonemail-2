// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
//= require jquery
//= require jquery_ujs
//= require underscore-min
//= require backbone-min
//= require_tree .
//

var App = {
};

window.App = App;

App.Message = Backbone.Model.extend({
  urlRoot: "/messages"
});

App.Messages = Backbone.Collection.extend({
  model: App.Message,
  url: "/messages"
});

App.MessageView = Backbone.View.extend({
  tagName: "li",
  className: "inbox_message",
  template: _.template("<header><%= subject %><button class='remove'>x</button></header><p><%= body %></p>"),

  events: {
    "click": "select",
    "click button.remove": "destroy"
  },

  initialize: function(){
    _.bindAll(this, "remove");
    this.model.bind("remove", this.remove);
  },

  select: function(){
    window.location.hash = "messages/" + this.model.id
  },

  destroy: function(){
    this.model.destroy();
  },

  render: function(){
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }
});

App.InboxView = Backbone.View.extend({
  tagName: "ul",
  className: "inbox",
  initialize: function(){
    _.bindAll(this, "renderMessage", "renderAllMessages");
    this.collection.bind("add", this.renderMessage);
    this.collection.bind("reset", this.renderAllMessages);
  },

  renderMessage: function(message) {
    var messageView = new App.MessageView({model: message});
    $(this.el).append(messageView.render().el);
  },

  renderAllMessages: function(messages) {
    messages.each(this.renderMessage);
  },

});

App.MessageDetailView = Backbone.View.extend({
  tagName: "article",
  className: "message",

  initialize: function() {
    _.bindAll(this, "render");
  },

  template: _.template("<header><%= subject %></header><p><%= body %></p>"),
  render: function(){
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }
});

var State = {
  listView: null,
  listVisible: true
};

App.MessagesRouter = Backbone.Router.extend({
  routes: {
    "messages": "index",
    "messages/:id": "show"
  },

  index: function(){
    this.loadMessages();
  },

  show: function(id) {
    if (State.listView !== "messages") {
      this.loadMessages();
    }
    this.showMessage(id);
  },

  loadMessages: function(){
    var messages = new App.Messages();
    window.inbox    = new App.InboxView({collection: messages});

    $("aside").html(inbox.el);
    State.listView = "messages";
    messages.fetch();
  },

  showMessage: function(id) {

    var message = new App.Message({id: id});
    message.fetch({
      success: function(model, response) {
        var messageDetailView = new App.MessageDetailView({model: model});
        $("#detail").html(messageDetailView.render().el);
      },
      error: function(model, response) {
        console.log("Teh Fail");
      }
    });
  }
});

$(function(){

  new App.MessagesRouter();
  Backbone.history.start();
});
