using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;

namespace Machine.Javascript.Bundler
{
  public class BundledScript
  {
    static readonly Regex CleanRegex = new Regex(@"\r\xEF\xBB\xBF");
    static readonly Regex BackSlash = new Regex(@"\\");
    static readonly Regex NewLine = new Regex(@"\n");
    static readonly Regex SingleQuote = new Regex(@"'");
    static readonly Regex IncludeExpression = new Regex(@"\s*include\(['""](.*?)['""]\).*");
    
    readonly string  _relativePath;
    readonly string _script;
    readonly string _basePath;
    readonly bool _isCss;

    public BundledScript(string script, string basePath)
    {
      _script = script;
      _basePath = basePath;
      _relativePath = script.JsPathRelativeTo(basePath).ToLowerInvariant();
      _isCss = _script.MatchesExtension(".css");
    }

    public string Script
    {
      get { return _script; }
    }

    public IEnumerable<BundledScript> TransientScripts
    {
      get
      {
        using(var reader = new StreamReader(_script))
        {
         while(!reader.EndOfStream)
         {
           var line = reader.ReadLine();
           var match = IncludeExpression.Match(line);
           if(match.Success)
           {
             var script = match.Groups[1].Value;
             var fullScriptPath = Path.Combine(_basePath, script);
             if(File.Exists(fullScriptPath))
             {
               Console.WriteLine( string.Format("Found Transient Script: {0}", fullScriptPath));
               yield return new BundledScript(fullScriptPath, _basePath);
             }
           }
         }
        }
      }
    }

    public void WriteTo(TextWriter writer )
    {
      Console.WriteLine(string.Format("Processing {0}", _script));
      Func<string, string> Clean = CleanBadCharCodes;
      Action<TextWriter> WriteStart = StartWriteJs;
      Action<TextWriter> WriteEnd = EndWriteJs;


      if (_isCss)
      {
        Clean = CleanCss;
        WriteStart = StartWriteCss;
        WriteEnd = EndWriteCss;
      }

      WriteStart(writer);
      using (var reader = new StreamReader(_script))
      {
        while (!reader.EndOfStream)
        {
          var line = reader.ReadLine() + "\n";
          line = Clean(line);
          writer.Write(line);
        }
      }
      WriteEnd(writer);
    }

    static void EndWriteJs(TextWriter writer)
    {
      writer.WriteLine("\n;\n});");
    }

    void StartWriteJs(TextWriter writer)
    {
      writer.WriteLine( string.Format("include.cache('{0}', function(){{", _relativePath));
    }

    void StartWriteCss(TextWriter writer)
    {
       writer.Write(string.Format("include.cache('{0}', '", _relativePath));
    }

    static void EndWriteCss(TextWriter writer)
    {
      writer.WriteLine(");");
    }

    static string CleanBadCharCodes(string scriptText)
    {
      return CleanRegex.Replace(scriptText, String.Empty);
    }
    static string CleanCss(string scriptText)
    {
      scriptText = CleanBadCharCodes(scriptText);
      scriptText = BackSlash.Replace(scriptText, @"\\");
      scriptText = NewLine.Replace(scriptText, @"\n");
      scriptText = SingleQuote.Replace(scriptText, @"\'");
      return scriptText;
    }

    public bool Equals(BundledScript other)
    {
      if (ReferenceEquals(null, other))
        return false;
      if (ReferenceEquals(this, other))
        return true;
      return Equals(other._relativePath, _relativePath);
    }

    public override bool Equals(object obj)
    {
      if (ReferenceEquals(null, obj))
        return false;
      if (ReferenceEquals(this, obj))
        return true;
      if (obj.GetType() !=
        typeof(BundledScript))
        return false;
      return Equals((BundledScript)obj);
    }

    public override int GetHashCode()
    {
      return (_relativePath != null ? _relativePath.GetHashCode() : 0);
    }

    public static bool operator ==(BundledScript left, BundledScript right)
    {
      return Equals(left, right);
    }

    public static bool operator !=(BundledScript left, BundledScript right)
    {
      return !Equals(left, right);
    }
  }
}