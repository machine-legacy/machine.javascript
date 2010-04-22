using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Machine.Javascript.Bundler
{
  public class ScriptLocation
  {
    readonly string _path;
    readonly string _basePath;
    readonly string _bundleFilePath;
    readonly string _bundleFileName;

    public string Path
    {
      get
      {
        return _path;
      }
    }

    public IEnumerable<ScriptLocation> SubLocations
    {
      get
      {
        return Directory.GetDirectories(_path).Select(path => new ScriptLocation(path, _basePath, _bundleFileName));
      }
    }

    public IEnumerable<string> BundledScriptLines
    {
      get
      {
        var scripts = Directory.GetFiles(_path).Where( path => !path.Equals(_bundleFilePath,StringComparison.InvariantCultureIgnoreCase) && (path.MatchesExtension(".css") || path.MatchesExtension(".js")));
        foreach(var script in scripts)
        {
          var scriptReader = new ScriptBundleFormater(script, script.JsPathRelativeTo(_basePath)); 
          foreach(var line in scriptReader.Lines)
          {
            yield return line; 
          }
        }
      }
    }

    public IEnumerable<string> LinesFromSubFolderBundles
    {
      get
      {
        foreach (var location in SubLocations)
        {
          if (File.Exists(location.BundleFilePath))
          {
            Console.WriteLine(string.Format("Also including content from {0}", location._bundleFilePath));
            using(var reader = new StreamReader(location.BundleFilePath))
            {
              while(!reader.EndOfStream)
              {
                yield return reader.ReadLine();
              }
            }
          }
        }

      }
    }
    public string BundleFilePath
    {
      get
      {
        return _bundleFilePath;
      }
    }

    public ScriptLocation(string path, string basePath, string bundleFileName)
    {
      _path = path;
      _basePath = basePath;
      _bundleFileName = bundleFileName;
      _bundleFilePath = System.IO.Path.Combine(Path, bundleFileName);
    }
  }
}