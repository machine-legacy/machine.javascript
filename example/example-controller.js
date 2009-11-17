include('../machine-controller.js');
include(function() {
  var global = this;
  global.ExampleController = function() {
    this.bag = {};
  };
  global.ExampleController.prototype = new Machine.Controller();
});
