using System.Collections.Generic;
using System.Linq;
using CommandLine;
using CommandLine.Text;

namespace Machine.Javascript.Bundler
{
  public class Options
  {
    [ValueList(typeof(List<string>))]
    public IList<string> PathsToBundle;

    [Option("r", "rootonly",
      HelpText = "Creates a single bundle for each given path containing all scripts found recursively below that folder",
      MutuallyExclusiveSet = "rs")]
    public bool RootOnly;

    [Option("b", "bundlename", HelpText = "Filename to use when creating bundles (defaults to bundle.js)")]
    public string BundleName = "bundle.js";


    [Option("s", "subfolders", MutuallyExclusiveSet = "rs",
          HelpText = "For each folder that is bundled include all scripts recursively from subfolders in the bundle")]
    public bool IncludeSubFolders;

    [Option("t", "transient",
      HelpText =
        "Use transient dependencies to include files included by bundled files in other folders")] 
    public bool TransientDependencies;

    [Option("b", "base",
      HelpText = "Base path used to calculate relative path of script used during production")] 
    public string _basePath;

    public string BasePath
    {
      get
      {
        return _basePath ?? PathsToBundle.First();      
      }
    }

    [HelpOption(HelpText = "Display this help screen")]
    public string GetUsage()
    {
      var help = new HelpText("Machine Javascript Bundler");
      help.AddPreOptionsLine(@"Example: jsbundler -b path\to\scripts path\to\scripts\folder1 path\to\scripts\folder2 \path\to\scripts\folder3");
      help.AddOptions(this);
      return help;
    }

  }
}