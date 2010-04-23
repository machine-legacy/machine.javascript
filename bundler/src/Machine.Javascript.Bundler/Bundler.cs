using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace Machine.Javascript.Bundler
{
  public class Bundler
  {
    readonly ScriptLocation _location;
    readonly bool _rootOnly;
    readonly bool _includeSubFolders;
    readonly bool _transientDependencies;
    readonly List<BundledScript> _bundledScripts = new List<BundledScript>();
    readonly List<Regex> _exclusions = new List<Regex>();

    public Bundler(ScriptLocation location, Options options)
    {
      _location = location;
      _rootOnly = options.RootOnly;
      _includeSubFolders = options.IncludeSubFolders;
      _transientDependencies = options.TransientDependencies;
      if(File.Exists(options.ExcludeFile))
      {
        ConfigureExclusions(options.ExcludeFile);
      }
    }

    void ConfigureExclusions(string excludeFile)
    {
      int lineNumber = 0;
      string line = "";
      try
      {
        using (var reader = new StreamReader(excludeFile))
        {
          while (!reader.EndOfStream)
          {
            lineNumber++;
            line = reader.ReadLine();
            line = line.Trim();
            if (!string.IsNullOrEmpty(line))
            {
              _exclusions.Add(new Regex(line, RegexOptions.IgnoreCase));
            }
          }
        }
      }
      catch(Exception ex)
      {
        Console.WriteLine(string.Format("Error While processing exclusion file {0} line {1}. Expression: {2}. Exception: {3}", excludeFile, lineNumber, line, ex));
        Environment.Exit(-1);
      }
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
        if(!_bundledScripts.Contains(script) && !IsExcluded(script))
        {
          _bundledScripts.Add(script);
          script.WriteTo(outputStream);
        }
      }
      if(!_rootOnly)
      {
        _bundledScripts.Clear();
      }
    }

    bool IsExcluded(BundledScript script)
    {
      return _exclusions.Any(exclusion => exclusion.Match(script.Script).Success);
    }
  }

}