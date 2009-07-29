(function() {
   var global = this;
   global.Machine = global.Machine || {};
   var Includer = global.Machine.Includer = {};


   Includer.configure = function(optionsToSet) {
      copyAttributes(options, optionsToSet || {});
      global[options.includeFunctionName] = include;
      this.load = loadIncludes;
   }

   var options = {
      scriptLocations: { "/": /.*/ },
      suffix: "",
      includeFunctionName: "include"
   }

   var includeQueue = [];
   var bundled = [];
   var includeContextStack = [];
   var includedScripts = {};

   var include = function(script) {
      if (typeof script == "string") {
         if (includedScripts[script]) {
            return;
         }
         includeQueue.push(function() { dynamicLoad(script); });
      }
      else {
         includeQueue.push(function() { runScript(script); });
      }
   };

   include.load = function() { loadIncludes(); };

   var loadIncludes = function() {
      if (includeQueue.length == 0) {
         if (includeContextStack.length == 0) {
            return;
         }
         includeQueue = includeContextStack.pop();
         loadIncludes();
      }
      var nextAction = includeQueue.shift();
      nextAction();
   }

   var runScript = function(script) {
      script.apply(global);
      loadIncludes();
   }

   var dynamicLoad = function(script) {
      var fullScriptPath = getFullScriptPath(script);
      includeContextStack.push(includeQueue);
      includeQueue = [];
      if (path.match(/\.css$/)) {
         appendTagToHead("link", { type: "text/css", rel: "stylesheet", href: fullScriptPath });
      }
      else {
         appendTagToHead("script", { type: "text/javascript", src: fullScriptPath});
      }
   }

   var appendTagToHead = function(tagName, attributes) {
      var tag = document.createElement(tagName);
      copyAttributes(tag, attributes);
      tag.onload = loadIncludes;
      tag.onreadystatechange = function() {
         if (this.readyState == 'complete' || this.readyState == 'loaded') {
            tag.onreadystatechange = null;
            loadIncludes();
         }
      }
      head.appendChild(tag);
   }

   var copyAttributes = function(destination, source) {
      for (var attribute in source) {
         destination[attribute] = source[attribute];
      }
   }

   var getFullScriptPath = function(script) {
      for (var path in options.scriptLocations) {
         if (script.matches(options.scriptLocations[path])) {
            return path.concat(script);
         }
      }
      return script;
   }

})();



