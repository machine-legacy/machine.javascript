(function(){
  var global = this;
  global.Machine = global.Machine || {};
  var includer = global.Machine.Includer = {};

  includer.load = loadIncludes;

  includer.configure = function(options){
    options = options || {};
    var includeFunctionName = options.includeFunction || "include";
    global[includeFunctionName] = include;
  }
 
  var includeQueue = []; 
  var includeContextStack = [];
  var includedScripts = {};

  var include = function(script){
    if(typeof script == "string"){
      if(includedScripts[script]){
        return;
      }
    }
    includeQueue.push(script);
  };

  include.load = function(){ loadIncludes();};

  var loadIncludes = function(){
    if(includeQueue.length == 0){
      if(includeContextStack == 0){
        return;
      }
      includeQueue = includeContextStack.pop();
      loadIncludes();
    }
    var script = includeQueue.shift();
    if(typeof script == "function"){
      script.apply(global);
      loadIncludes();
    }
    else{
      loadScript(script);
    }

  }

  var loadScript = function(script){
    includeContextStack.push(includeQueue);
    includeQueue = [];

    var head = document.getElementsByTagName("head")[0];
    var scriptTag = document.createElement("script");
    scriptTag.type = 'text/javascript';
    scriptTag.src = script;

    scriptTag.onload = loadIncludes;
    scriptTag.onreadystatechange = function(){
      if(this.readyState == 'complete' || this.readyState == 'loaded'){
        scriptTag.onreadystatechange = null;
        loadIncludes();
      }
    }
    head.appendChild(scriptTag);
  }
})();




