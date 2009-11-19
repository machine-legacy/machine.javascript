include(function() {
  var global = this;
  global.DefaultViewRenderer = function(view) {
  };

  global.DefaultViewRenderer.prototype.render = function(controller, parameters) {
    return parameters.view;
  };
});
