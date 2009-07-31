(function() {
   var global = this;
   global.Machine = global.Machine || {};
   var Includer = global.Machine.Includer = {};


   Includer.configure = function(optionsToSet) {
      copyAttributes(options, optionsToSet || {});
      global[options.includeFunctionName] = include;
   };

   var options = {
      scriptLocations: { ".*": "/" },
      suffix: "",
      includeFunctionName: "include",
      loaders: {}
   };

   var includeQueue = [];
   var includeContextStack = [];
   var includedScripts = {};
   var cachedScripts = {};
   var loading = false;

   var include = function(script) {
      if (typeof script == "string") {
         includeQueue.push(function() { includeScript(script); });
      }
      else {
         includeQueue.push(function() { runScript(script); });
      }
   };

   include.cache = function(key, action) {
      cachedScripts[key] = function() {
         includedScripts[key] = true;
         if (isCss(key)) {
            insertCachedStyle(key, action);
         }
         else {
            insertCachedScript(key, action);
         }
      };
   };

   var getFunctionInnerSource = function(fn) {
      var src = fn.toString();
      var openBraceIdx = src.indexOf("{");
      return src.substr(openBraceIdx + 1, src.length - (openBraceIdx + 2));
   };

   var insertCachedScript = function(name, scriptWrappedInFunction) {
      newIncludeContext();
      appendTagToHead("script", { type: "text/javascript", name: name }, getFunctionInnerSource(scriptWrappedInFunction));
      loadIncludes();
   };

   var insertCachedStyle = function(name, styleText) {
      appendTagToHead("style", { type: "text/css" }, styleText);
      loadIncludes();
   };

   include.load = function() {
      if (loading == false) {
         loading = true;
         loadIncludes()
      }
   };

   var loadIncludes = function() {
      if (includeQueue.length == 0) {
         if (includeContextStack.length == 0) {
            loading = false;
            //console.log("Done with includes");
            return;
         }
         includeQueue = includeContextStack.pop();
         loadIncludes();
         return;
      }
      var nextAction = includeQueue.shift();
      nextAction();
   };

   var includeScript = function(script) {
      if (includedScripts[script]) {
         loadIncludes();
         return;
      }
      includedScripts[script] = true;
      if (cachedScripts[script]) {
         //console.log("Loading " + script + " from cache");
         cachedScripts[script]();
      }
      else {
         //console.log("Dynamic load " + script);
         dynamicLoad(script);
      }
   };

   var runScript = function(script) {
      script.apply(global);
      loadIncludes();
   };

   var newIncludeContext = function() {
      includeContextStack.push(includeQueue);
      includeQueue = [];
   };

   var isCss = function(path) {
      return path.match(/\.css$/)
   };

   var dynamicLoad = function(script) {
      newIncludeContext();
      var fullScriptPath = getFullScriptPath(script);
      var loader = getSpecialLoader(script);
      if (loader != null) {
         loader(script, fullScriptPath, loadIncludes);
      }
      else if (isCss(script)) {
         appendTagToHead("link", { type: "text/css", rel: "stylesheet", href: fullScriptPath });
         loadIncludes();
      }
      else {
         appendTagToHead("script", { type: "text/javascript", src: fullScriptPath });
      }
   };

   var appendTagToHead = function(tagName, attributes, body) {
      var tag = document.createElement(tagName);
      copyAttributes(tag, attributes);
      if (body) {
         tag.appendChild(document.createTextNode(body));
      }
      if (tagName == "script") {
         tag.onload = loadIncludes;
         tag.onreadystatechange = function() {
            if (this.readyState == 'complete' || this.readyState == 'loaded') {
               tag.onreadystatechange = null;
               loadIncludes();
            }
         }
      }
      var head = document.getElementsByTagName("head")[0];
      head.appendChild(tag);
   };

   var copyAttributes = function(destination, source) {
      for (var attribute in source) {
         destination[attribute] = source[attribute];
      }
   };

   var getFullScriptPath = function(script) {
      for (var pattern in options.scriptLocations) {
         if (script.match(new RegExp(pattern))) {
            return options.scriptLocations[pattern].concat(script).concat(options.suffix);
         }
      }
      return script;
   };

   var getSpecialLoader = function(script) {
      for (var pattern in options.loaders) {
         if (script.match(new RegExp(pattern))) {
            return options.loaders[pattern];
         }
      }
      return null;
   };

})();



