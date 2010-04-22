using System;
using System.IO;

namespace Machine.Javascript.Bundler
{
  public static class PathExtensions
  {
    public static bool MatchesExtension(this string path, string extension)
    {
      var pathExtension = Path.GetExtension(path); 
      return pathExtension.Equals(extension,StringComparison.InvariantCultureIgnoreCase);
    }

    public static string JsPathRelativeTo(this string path, string basePath)
    {
      if(path.StartsWith(basePath, StringComparison.InvariantCultureIgnoreCase))
      {
        return path.Remove(0, basePath.Length+1).Replace('\\','/');
      }
      return path;
    }
  }
}