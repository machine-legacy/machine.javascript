(function(){


Screw.Unit(function(){  
  function MyController(){
  }

  MyController.prototype = new Machine.Controller();
  var controller;



  describe("View Rendering",function(){
    before(function(){
     controller = new MyController(); 
    });

    describe("When no renderer specified",function(){
      var myView = "<div>THIS IS MY VIEW $VAR</div>";
      before(function(){
        controller.setView(myView);
        controller.render();
      });

      it("Should default to dumb renderer that simply returns the view", function(){
        expect(controller.domRoot.html()).to(equal, $(myView).html());   
      });
      
      describe("When custom default renderer was registered", function(){
        var usedMyDefault = false;
        function MyDefaultRenderer(view){
          this.render = function(controller, model){
           usedMyDefault = true;
           return $("<div></div>");
          };
        }
        before(function(){
          Machine.Controller.registerViewRenderer("default", MyDefaultRenderer);
          controller.setView(myView);
          controller.render();
        });

        it("Should use the custom one instead of the original default",function(){
          expect(usedMyDefault).to(be_true);
        });


      });
    });
    describe("When custom renderer was registered", function(){
        var usedMyCustom = false;
        function MyCustomRenderer(view){
          this.render = function(controller, model){
           usedMyCustom = true;
           return $("<div></div>");
          };
        }

        before(function(){
          Machine.Controller.registerViewRenderer("custom", MyCustomRenderer);
        });

        describe("When view is set to render with custom renderer", function(){
          before(function(){
            controller.setView("anything", "custom");
            controller.render();
          });

          it("Should use the defined renderer",function(){
            expect(usedMyCustom).to(be_true);
          });
        });

      });
    });

    describe("View Reigstration", function() {
      function FooViewRenderer(view) { }
      FooViewRenderer.prototype.render = function(ctlr, model) { return "<div id='foo'></div>"; }

      var controller;


      describe("When a controller calls setView with 'Foo' as the renderer name when the renderer was globally registered with the name 'foo'", function() {

        before(function() {
          Machine.Controller.registerViewRenderer("Foo", FooViewRenderer);
  
          controller = new MyController();
          controller.setView("", "foo");
          
          controller.render();
        });
        
        it("should treat renderer names as case-insensitive and wire the renderer up to the controller", function() {
          expect($(controller.domRoot).attr('id')).to(equal, "foo");
        });
      });
    });
});

}());
