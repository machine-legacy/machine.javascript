using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Machine.Javascript.Bundler
{
  public class Bundler
  {
    readonly bool _rootOnly;
    readonly bool _includeSubFolders;

    public Bundler(Options options)
    {
      _rootOnly = options.RootOnly;
      _includeSubFolders = options.IncludeSubFolders;
    }

    public void CreateBundles(ScriptLocation location)
    {
      Console.WriteLine("Creating Javascript Bundles.....");
      try
      {

        if (_rootOnly)
        {
          using (var outputStream = new StreamWriter(location.BundleFilePath))
          {
            Console.WriteLine( string.Format("Creating single bundle at {0}", location.BundleFilePath));
            CreateBundles(location, outputStream);
          }
        }
        else
        {
          CreateBundles(location, null);
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

      var bundledScriptLines = location.BundledScriptLines;

      if (outputStream == null)
      {
        if (_includeSubFolders)
        {
          bundledScriptLines = bundledScriptLines.Concat(location.LinesFromSubFolderBundles);
        }

        using (var bundleStream = new StreamWriter(location.BundleFilePath))
        {
          Console.WriteLine("\n======= Processing files to include in {0}", location.BundleFilePath);
          WriteBundle(bundleStream, bundledScriptLines);
          Console.WriteLine(string.Format("Writing {0}", location.BundleFilePath));
        }
      }
      else
      {
        WriteBundle(outputStream, bundledScriptLines);
      }

    }

    static void WriteBundle(TextWriter outputStream, IEnumerable<string> scriptLines)
    {
      foreach (var line in scriptLines)
      {
        outputStream.WriteLine(line);
      }
    }

  }
}