(function() {
   this.Machine = this.Machine || {};
   var global = this,
       Includer = global.Machine.Includer = {},
       includeQueue = [],
       includeContextStack = [],
       includedScripts = {},
       cachedScripts = {},
       loading = false,
       options = {
          scriptLocations: { ".*": "/" },
          suffix: "",
          includeFunctionName: "include",
          loaders: {}
       };


   function copyAttributes(destination, source) {
      for (var attribute in source) {
         if (source.hasOwnProperty(attribute)) {
            destination[attribute] = source[attribute];
         }
      }
   }

   function loadIncludes() {
      if (includeQueue.length === 0) {
         if (includeContextStack.length === 0) {
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
   }

   function newIncludeContext() {
      includeContextStack.push(includeQueue);
      includeQueue = [];
   }

   function getMatchingPrefixAndPath(path) {
      var expression,
          match;
      for (var pattern in options.scriptLocations) {
         if (options.scriptLocations.hasOwnProperty(pattern)) {
            expression = new RegExp(pattern);
            match = path.match(expression);
            if (match) {
               if (match.length === 2) {
                  path = match[1];
               }
               return { prefix: options.scriptLocations[pattern], path: path };
            }
         }
      }
      return { prefix: "", path: path };
   }


   function getFullScriptPath(script) {
      var matches = getMatchingPrefixAndPath(script);
      return matches.prefix + matches.path + options.suffix;
   }

   function getFullScriptBasePath(script) {
      var fullPath = getFullScriptPath(script);
      return fullPath.replace(/\/.*$/, "");
   }

   function getSpecialLoader(script) {
      for (var pattern in options.loaders) {
         if (script.match(new RegExp(pattern))) {
            return options.loaders[pattern];
         }
      }
      return null;
   }

   function isCss(path) {
      return path.match(/\.css$/);
   }

   function appendTagToHead(tagName, attributes, body) {
      var tag = document.createElement(tagName);
      copyAttributes(tag, attributes);
      if (body) {
         if (undefined === tag.canHaveChildren || tag.canHaveChildren) {
            tag.appendChild(document.createTextNode(body));
         }
         else {
            if (tagName === "style") {
               tag.styleSheet.cssText = body;
            }
            else {
               tag.text = body;
            }
         }
      }
      if (tagName === "script" && !body) {
         tag.onload = loadIncludes;
         tag.onreadystatechange = function() {
            if (this.readyState === 'complete' || this.readyState === 'loaded') {
               tag.onreadystatechange = null;
               loadIncludes();
            }
         };
      }
      var head = document.getElementsByTagName("head")[0];
      head.appendChild(tag);
   }

   function dynamicLoad(script) {
      newIncludeContext();
      var fullScriptPath = getFullScriptPath(script);
      var loader = getSpecialLoader(script);
      if (loader !== null) {
         loader(script, fullScriptPath, loadIncludes);
      }
      else if (isCss(script)) {
         appendTagToHead("link", { type: "text/css", rel: "stylesheet", href: fullScriptPath });
         loadIncludes();
      }
      else {
         appendTagToHead("script", { type: "text/javascript", src: fullScriptPath });
      }
   }

   function includeScript(script) {
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
   }

   function runScript(script) {
      script.apply(global);
      loadIncludes();
   }

   function include(script) {
      if (typeof script === "string") {
         includeQueue.push(function() { includeScript(script); });
      }
      else {
         includeQueue.push(function() { runScript(script); });
      }
   }

   function insertCachedStyle(name, styleText) {
      styleText = styleText.replace(/url\s*\(\s*['"]?\s*(?!http)/g, "url('" + getFullScriptBasePath(name));
      appendTagToHead("style", { type: "text/css" }, styleText);
      loadIncludes();
   }

   function getFunctionInnerSource(fn) {
      var src = fn.toString();
      var openBraceIdx = src.indexOf("{");
      return src.substr(openBraceIdx + 1, src.length - (openBraceIdx + 2)) + "\n\n" + options.includeFunctionName + ".cacheCallback();\n";
   }


   function insertCachedScript(name, scriptWrappedInFunction) {
      newIncludeContext();
      appendTagToHead("script", { type: "text/javascript", name: name }, getFunctionInnerSource(scriptWrappedInFunction));
      //      loadIncludes();
   }

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

   include.cacheCallback = function() {
      setTimeout(loadIncludes, 1);
   };

   Includer.configure = function(optionsToSet) {
      copyAttributes(options, optionsToSet || {});
      global[options.includeFunctionName] = include;
   };

   include.load = function() {
      if (loading === false) {
         loading = true;
         loadIncludes();
         return;
      }
   };
})();



