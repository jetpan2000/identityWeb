using Octacom.Odiss.Library.Utils;
using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
            filters.Add(new LocalizationAttribute("en"), 0); // Default language = en
        }
    }
}