using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;

namespace Machine.Javascript.Bundler
{
  public class ScriptBundleFormater
  {
    static readonly Regex CleanRegex = new Regex(@"\r\xEF\xBB\xBF");
    static readonly Regex BackSlash = new Regex(@"\\");
    static readonly Regex NewLine = new Regex(@"\n");
    static readonly Regex SingleQuote = new Regex(@"'");
    
    readonly string  _relativePath;
    readonly string _script;

    public ScriptBundleFormater(string script, string relativePath)
    {
      _script = script;
      _relativePath = relativePath;
    }

    public IEnumerable<string> Lines
    {
      get
      {
        Console.WriteLine(string.Format("Processing {0}",_script));
        using(var reader = new StreamReader(_script))
        {
          var scriptText = reader.ReadToEnd();
          scriptText = CleanRegex.Replace(scriptText, String.Empty);

          if(_script.MatchesExtension(".css"))
          {
            scriptText = CleanCss(scriptText);
            yield return string.Format("include.cache('{0}', '{1}');", _relativePath, scriptText);
          }
          else
          {
            yield return string.Format("include.cache('{0}', function(){{\n{1}\n;}});\n",_relativePath, scriptText);
          }
         
        }
      }
    }

    static string CleanCss(string scriptText)
    {
      scriptText = BackSlash.Replace(scriptText, @"\\");
      scriptText = NewLine.Replace(scriptText, @"\n");
      scriptText = SingleQuote.Replace(scriptText, @"\'");
      return scriptText;
    }
  }
}