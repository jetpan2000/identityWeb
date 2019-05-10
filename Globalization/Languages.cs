using Newtonsoft.Json.Linq;
using Octacom.Odiss.Library.Config;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace Octacom.Odiss.ABCgroup.Web.Globalization
{
    public class Languages
    {
        public string Initials { get; set; }
        public string Name { get; set; }

        public Languages(string initials, string name)
        {
            Initials = initials;
            Name = name;
        }

        /// <summary>
        /// Get all supported languages (with resources pre-defined)
        /// </summary>
        /// <returns></returns>
        public static IEnumerable<Languages> GetAll()
        {
            // Languages with resources
            return new List<Languages> {
                new Languages("en", Words.Language_English),
                new Languages("fr", Words.Language_French),
                new Languages("pt", Words.Language_Portuguese),
                new Languages("es", Words.Language_Spanish)
            };
        }

        /// <summary>
        /// Get all enabled languages for the current website
        /// </summary>
        /// <returns></returns>
        public static IEnumerable<Languages> GetAllEnabled()
        {
            return GetAll().Where(a => ConfigBase.Settings.EnabledLanguages.Contains(a.Initials));
        }

        public static dynamic GetJson()
        {
            return GetJson(null, true);
        }

        public static dynamic GetJson(string[] keys, bool all = false)
        {
            var resourceObject = new JObject();

            var resourceSet = Words.ResourceManager.GetResourceSet(Thread.CurrentThread.CurrentUICulture, true, true);

            IDictionaryEnumerator enumerator = resourceSet.GetEnumerator();

            while (enumerator.MoveNext())
            {
                if (all || (keys != null && keys.Length > 0 && keys.Contains(enumerator.Key?.ToString())))
                {
                    if (enumerator.Key == null)
                        continue;

                    resourceObject.Add(enumerator.Key.ToString(), enumerator.Value.ToString());
                }
            }

            return resourceObject;
        }
    }
}