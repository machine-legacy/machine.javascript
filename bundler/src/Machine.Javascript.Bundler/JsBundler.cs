using System;
using CommandLine;
using System.Linq;

namespace Machine.Javascript.Bundler
{
  class JsBundler
  {
    static void Main(string[] args)
    {
      var parserSettings = new CommandLineParserSettings(false, true);
      var parser = new CommandLineParser(parserSettings);
      var options = new Options();
      if (!parser.ParseArguments(args, options))
      {
        Console.WriteLine(options.GetUsage());
        Environment.Exit(-1);
      }

      var scriptLocations = options.PathsToBundle.Select(path => new ScriptLocation(path, options.BasePath, options.BundleName));
      var bundler = new Bundler(options);

      foreach (var location in scriptLocations)
      {
        bundler.CreateBundles(location);
      }
    }
  }
}