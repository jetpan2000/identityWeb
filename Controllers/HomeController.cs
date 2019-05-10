using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Auth;
using Octacom.Odiss.Library.Config;
using Octacom.Odiss.ABCgroup.Web.Globalization;
using System;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    public class HomeController : Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.BaseController
    {
        /// <summary>
        /// Redirects to the first Application or shows a page when user have no application configured
        /// </summary>
        /// <returns></returns>
        [LoginRequired]
        public ActionResult Index()
        {
            var filteredApps = ConfigBase.Settings.Applications.FilterForLoggedUser(User);
            var firstApp = filteredApps.FirstOrDefault();
            var firstDefault = filteredApps.FirstOrDefault(a => a.ID == ConfigBase.Settings.DefaultApplication);

            if (ConfigBase.Settings.DefaultApplication != null && firstDefault != null)
            {
                firstApp = firstDefault;
            }

            if (firstApp != null)
            {
                return RedirectToRoute(firstApp.AppBaseUrl, new { id = firstApp.ID });
            }

            return View();
        }

        /// <summary>
        /// Return the site Logo
        /// </summary>
        /// <returns></returns>
        [OutputCache(Duration = 60 * 60)]
        public ActionResult Logo()
        {
            if (string.IsNullOrWhiteSpace(ConfigBase.Settings.Logo)) return null;

            byte[] imageBytes = Convert.FromBase64String(ConfigBase.Settings.Logo);

            using (MemoryStream ms = new MemoryStream(imageBytes, 0, imageBytes.Length))
            {
                ms.Write(imageBytes, 0, imageBytes.Length);

                return File(imageBytes, "image/png");
            }
        }

        [OutputCache(Duration = 60 * 60)]
        public ActionResult Blank()
        {
            return View();
        }

        public JsonResult ChangeLanguage(string l)
        {
            try
            {
                string _langToSet = "en";

                if (ConfigBase.Settings != null && ConfigBase.Settings.EnabledLanguages != null)
                {
                    var whatLanguage = ConfigBase.Settings.EnabledLanguages.Where(l.StartsWith);

                    if (whatLanguage != null)
                    {
                        _langToSet = whatLanguage.FirstOrDefault();
                    }
                }

                if (string.IsNullOrWhiteSpace(_langToSet))
                    _langToSet = "en";

                HttpCookie cookieLanguage = new HttpCookie("odisslang", _langToSet)
                {
                    HttpOnly = true,
                    Path = HttpContext.Request.ApplicationPath
                };

                HttpContext.Response.Cookies.Add(cookieLanguage);

                return Json(new { status = true });
            }
            catch (Exception ex)
            {
                ex.Log();
                return Json(new { status = false });
            }
        }

        [OutputCache(Duration = 60 * 60)]
        public ActionResult Words()
        {
            return JavaScript("var Words = " + Languages.GetJson() + ";");
        }
    }
}