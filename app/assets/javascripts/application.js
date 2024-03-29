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
  urlRoot: "/messages",
  
  defaults: {
    selected: false,
    selectionRequested: false
  },
  
  reset: function() {
    this.set({
      selected: false
    });
  },
  
  toggleSelected: function() {
    var newSelectedState = !this.get('selected');
    this.set({
      selected: newSelectedState
    });
    return newSelectedState;
  },
  
  toggleSelectionRequested: function() {
    var newSelectionRequestedState = !this.get('selectionRequested');
    this.set({
      selectionRequested: newSelectionRequestedState
    });
    return newSelectionRequestedState;
  },
  
  isSelected: function() {
    return this.get('selected');
  },
  
  selectionHasBeenRequested: function() {
    return this.get('selectionRequested');
  }
});

App.Messages = Backbone.Collection.extend({
  model: App.Message,
  url: "/messages",
  selectedMessageID: null,
  handlingSelectionRequest: false,

  initialize: function() {
    _.bindAll(this, "handleSelectionRequest");
    this.bind("change:selectionRequested", this.handleSelectionRequest);
    this.bind("remove", this.handleRemoval);
  },
  
  handleSelectionRequest: function() {
    if (!this.handlingSelectionRequest) {
      this.handlingSelectionRequest = true;
      
      var selectionRequests = this.select(function(message) { return message.selectionHasBeenRequested(); });

      var i = 0;
      for (i = 0; i < selectionRequests.length; i++) {
        var message = selectionRequests[i];
        
        if (this.selectedMessageID !== message.id) {
          if (this.selectedMessageID !== null) {
            this.get(this.selectedMessageID).toggleSelected();
          }
          
          message.toggleSelected();
          this.selectedMessageID = message.id;
        }

        message.toggleSelectionRequested();        
        
        break;
      }
      
      this.handlingSelectionRequest = false;
    }
  },
  
  handleRemoval: function() {
    if (this.get(this.selectedMessageID) == undefined){
      this.selectedMessageID = null;
    }
  }
});

App.MessageView = Backbone.View.extend({
  tagName: "li",
  className: "inbox_message",
  template: _.template("<header><%= subject %><button class='remove'>x</button></header><p><%= body %></p>"),
  templateSelected: _.template("<header class='selected'><%= subject %><button class='remove'>x</button></header><p><%= body %></p>"),

  events: {
    "click": "requestSelection",
    "click button.remove": "remove",
  },

  initialize: function(){
    _.bindAll(this, "remove",
                    "render");
    this.model.bind("change:selected", this.render);
    this.messages = this.collection;
  },

  remove: function(){
    this.model.destroy();
    $(this.el).remove();
    window.location.hash = "";
  },

  render: function(){
    if (this.model.isSelected())
      $(this.el).html(this.templateSelected(this.model.toJSON()));
    else
      $(this.el).html(this.template(this.model.toJSON()));
    return this;
  },

  requestSelection: function(){
    if (this.model.toggleSelectionRequested())
      window.location.hash = "messages/" + this.model.id;
    else
      window.location.hash = "";
    return this;
  }
});

App.MessageComposerView = Backbone.View.extend({
  tagName: "header",
  className: "message_composer",
  
  events: {
    "click button.add": "addMessage"
  },
  
  initialize: function() {
    _.bindAll(this, "render");
    this.collection.bind("reset", this.render);
    this.messages = this.collection;
  },
  
  render: function() {
    $(this.el).html('Subject: <input type="text" name="subject" id="subject-box" /> Body: <input type="text" name="body" id="body-box" /><button class="add">Add</button>');
    return this;
  },
  
  addMessage: function() {
    var subject = $("#subject-box").val();
    var body = $("#body-box").val();
    var message = new App.Message({"subject": subject, "body": body});
    message.save();
    this.messages.add(message);
    return this;
  }
});

App.InboxView = Backbone.View.extend({
  tagName: "ul",
  className: "inbox",
  
  initialize: function(){
    _.bindAll(this, "renderMessage",
                    "renderAllMessages");
    this.collection.bind("add", this.renderMessage);
    this.collection.bind("reset", this.renderAllMessages);
  },
  
  reset: function() {
    this.collection.reset();
  },

  renderMessage: function(message) {
    var messageView = new App.MessageView({model: message});
    $(this.el).append(messageView.render().el);
  },

  renderAllMessages: function(messages) {
    messages.each(this.renderMessage);
  }
});

App.MessageDetailView = Backbone.View.extend({
  tagName: "p",
  className: "message",
  template: _.template("<header><%= subject %></header><p><%= body %></p>"),

  initialize: function() {
    _.bindAll(this, "render");
    this.model.bind("destroy", this.remove);
  },

  render: function() {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  },
  
  remove: function() {
    console.log("hey!");
    $(this.el).remove();
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
