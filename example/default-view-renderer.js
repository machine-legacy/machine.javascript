include(function() {
  var global = this;
  global.DefaultViewRenderer = function(view) {
  };

  global.DefaultViewRenderer.render = function(controller, parameters) {
    return parameters.content;
  };
});
