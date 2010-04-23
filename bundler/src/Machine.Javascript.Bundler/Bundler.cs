using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Machine.Javascript.Bundler
{
  public class Bundler
  {
    readonly ScriptLocation _location;
    readonly bool _rootOnly;
    readonly bool _includeSubFolders;
    readonly bool _transientDependencies;
    readonly List<BundledScript> _bundledScripts = new List<BundledScript>();

    public Bundler(ScriptLocation location, Options options)
    {
      _location = location;
      _rootOnly = options.RootOnly;
      _includeSubFolders = options.IncludeSubFolders;
      _transientDependencies = options.TransientDependencies;
    }

    public void CreateBundles()
    {
      Console.WriteLine("Creating Javascript Bundles.....");
      try
      {

        if (_rootOnly)
        {
          using (var outputStream = new StreamWriter(_location.BundleFilePath))
          {
            Console.WriteLine( string.Format("Creating single bundle at {0}", _location.BundleFilePath));
            CreateBundles(_location, outputStream);
          }
        }
        else
        {
          CreateBundles(_location, null);
        }
      }
      catch(Exception ex)
      {
        Console.WriteLine(string.Format("Error while writing bundles: {0}",ex));
      }

    }

    void CreateBundles(ScriptLocation location, TextWriter outputStream)
   {
      foreach (var subLocation in location.SubLocations)
      {
        CreateBundles(subLocation, outputStream);
      }

      var bundledScriptLines = location.BundledScripts;

      if (outputStream == null)
      {

        if(_transientDependencies)
        {
          bundledScriptLines = bundledScriptLines.Concat(location.TransientDependencyScripts); 
        }

        using (var bundleStream = new StreamWriter(location.BundleFilePath))
        {
          Console.WriteLine("\n======= Processing files to include in {0}", location.BundleFilePath);
          WriteBundle(bundleStream, bundledScriptLines);

          if(_includeSubFolders)
          {
            location.WriteSubFolderBundles(bundleStream);
          }

          Console.WriteLine(string.Format("Writing {0}", location.BundleFilePath));
        }
      }
      else
      {
        WriteBundle(outputStream, bundledScriptLines);
      }

    }

    void WriteBundle(TextWriter outputStream, IEnumerable<BundledScript> bundledScripts)
    {
      foreach (var script in bundledScripts)
      {
        if(!_bundledScripts.Contains(script))
        {
          _bundledScripts.Add(script);
          script.WriteTo(outputStream);
        }
      }
    }

  }

}