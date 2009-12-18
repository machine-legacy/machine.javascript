/*global document, $, alert*/
"use strict";
(function() {
   this.Machine = this.Machine || {};
   var global = this,
       NonBubblingEvents = ["change", "focus", "blur"],
       Controller = this.Machine.Controller = function() {
       },
       Action = this.Machine.Controller.Action = function(event, matcher, callback) {
          this.event = event;
          this.matcher = matcher;
          this.callback = callback;
       },
       ControllerRegistration = this.Machine.Controller.ControllerRegistration = function(selector, controller) {
          this.selector = selector;


          switch (typeof (controller)) {
             case 'object':
                this.getController = function() {
                   return controller;
                };
                break;
             case 'function':
                this.getController = controller;
                break;
          }
       },
       // 
       renderers = { "default": function(view){ this.render=function(){return view;}}};
      Public = Controller.prototype;
      Controller.registerViewRenderer = function(name, renderer){
        renderers[name] = renderer;
      };

   /*Private members*/
   function unbindDeepElements() {
      if (this.elementsToUnbind) {
         $.each(this.elementsToUnbind, function() {
            this.unbind();
         });
         this.elementsToUnbind = [];
      }
   }

   function isNonBubbling(eventName) {
      if ($.inArray(eventName, NonBubblingEvents) >= 0) {
         return true;
      }
      return false;
   }

   function getElementForBind(action) {
      if (isNonBubbling(action.event)) {
         return this.domRoot.find(action.matcher);
      }
      return this.domRoot;
   }

   function onEvent(event, eventData) {
      var action = event.data.action,
          eventElement = event.target,
          selectorTopElements,
          eventArguments = arguments;
      var self = this;

      function doCallBack() {
         action.callback.apply(this, eventArguments);
      }

      if (action.matcher === "*") {
         doCallBack.call(self);
         return;
      }

      selectorTopElements = this.domRoot.find(action.matcher);

      if ($.inArray(eventElement, selectorTopElements) >= 0) {
         event.actionTarget = event.target;
         doCallBack.call(self);
         return;
      }
      else {
         $.each(selectorTopElements, function(i, descendantElement) {
            if ($.inArray(eventElement, $(descendantElement).find("*")) >= 0) {
               event.actionTarget = descendantElement;
               doCallBack.call(self);
               return false;
            }
            return true;
         });
      }
   }

   function getActionsForEvent(event) {
      var actions = [];
      $.each(this.actions, function(index, action) {
         if (event === action.event) {
            actions.push(action);
         }
      });
      return actions;
   }

   function newRenderer(view, renderer) {
      if (renderer === undefined) {
         renderer = "default";
      }
      if (typeof (renderer) === "string") {
         var RendererClass = renderers[renderer.toLowerCase()];
         return new RendererClass(this.view);
      }
      return renderer;
   }

   function cascadeRemove() {
      $.each(this.controllers, function() {
         if (this) {
            this.remove();
         }
      });
   }

   function setDomRoot(element) {
      var dom;
      if (typeof (element) === "string") {
         dom = $(document.createElement('div'));
         dom.html(element);
         dom = dom.children();
      }
      else {
         dom = element;
      }
      if (dom.length > 1) {
         alert("Controller needs a single root node element. " + this.view + " Could mean the template wasn't found, check request.");
         return;
      }
      if (this.domRoot) {
         cascadeRemove.call(this);
         this.domRoot.replaceWith(dom);
      }
      this.domRoot = dom;
   }

   function attachSubControllers() {
      var self = this;
      $.each(this.controllerRegistrations, function(index, registration) {
         this.domRoot.find(registration.selector).each(function(index) {
            var attachPoint = this,
                controller = registration.getController.call(self, attachPoint, index);
            if ($(attachPoint).chidlren().length > 0) {
               controller.attachToExistingDom(attachPoint, true);
            }
            else {
               controller.render();
               attachPoint.replaceWith(controller.domRoot);
            }
         });
      });
   }

   function postRenderInternal() {
      this.reBindActions();
      attachSubControllers.call(this);
      this.isRendered = true;
      this.renderFinished.call(this);
   }

   function getOnEventCallBack() {
      var self = this;
      return function() { onEvent.apply(self, arguments); };
   }


   /* Public Members */
   Public.init = function(){
      this.actions = [];
      this.renderFinished = function() { };
      this.controllerNameAttribute = 'controller';
      this.model = {};
      this.controllers = {};
      this.controllerRegistrations = [];
      this.elementsToUnbind = [];
   };

   Public.addAction = function(eventName, matcher, callback) {
      this.actions.push(new Action(eventName, matcher ? matcher : '*', callback));
   };

   Public.onRenderFinish = function(callback) {
      this.renderFinished = callback;
   };

   Public.reBindActions = function() {
      var self = this, action, element, i;
      this.domRoot.unbind();
      unbindDeepElements.call(this);

      for (i = 0; i < this.actions.length; i += 1) {
         action = this.actions[i];
         element = getElementForBind.call(this, action);
         element.bind(action.event, { action: action }, getOnEventCallBack.call(self));
         if (element !== this.domRoot) {
            this.elementsToUnbind.push(element);
         }
      }
      this.isAttached = true;
   };

   /* Simulate given even on the given element */
   Public.raiseEvent = function(event, element, eventData) {
      var self = this,
          actions = getActionsForEvent.call(this, event);

      $.each(actions, function(index, action) {
         self.onEvent({ target: element[0], data: { action: action} }, eventData);
      });
   };

   Public.render = function() {
      if (this.view !== undefined) {
         var renderedString = this.doRender(this, this.model);
         setDomRoot.call(this, renderedString);
      }
      postRenderInternal.call(this);
   };

   //Sets the view along with the renderer (short name or object) that will be used to render the view
   Public.setView = function(view, renderer) {
      this.view = view;
      renderer = newRenderer.call(this, view, renderer);
      this.doRender = function() {
         return renderer.render.apply(renderer, arguments);
      };
   };

   Public.publishEvent = function(event, args) {
      this.publishEventFromElement(this.domRoot, event, args);
   };

   Public.publishEventFromElement = function(element, event, args) {
      if (typeof (args) === "undefined") {
         args = {};
      }
      args.sender = this;
      element.trigger(event, args);
   };

   Public.attachToExistingDom = function(domNode, triggerPostRenderCallbacks) {
      setDomRoot.call(this, domNode);
      if (triggerPostRenderCallbacks) {
         postRenderInternal.call(this);
      }
   };

   Public.remove = function() {
      if (this.isRendered) {
         this.cascadeRemove();
         this.domRoot.remove();
         this.domRoot = undefined;
         this.isRendered = false;
      }
   };

   Public.registerSubController = function(selector, controller) {
      this.controllerRegistrations.push(new ControllerRegistration(selector, controller));
   };
} ());
