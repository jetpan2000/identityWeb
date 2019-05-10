using System;
using System.Linq;
using System.Web.Mvc;
using Octacom.Odiss.ABCgroup.Web.Code;
using Octacom.Odiss.ABCgroup.Web.Models;
using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Auth;
using Octacom.Odiss.Library.Config;
using Octacom.Odiss.Library.Custom;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    public class APMiniController : Controller
    {
        [CustomActionFilter(CustomActionFilterEnum.ViewerTab)]
        public ActionResult Invoice(Guid? id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs, string extra = null)
        {
            if (docs == null || docs.Count() != 1)
            {
                return new HttpNotFoundResult();
            }

            var authPrincipal = Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.AuthPrincipalHelper.GetAuthPrincipalFromClaims(HttpContext);

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(authPrincipal, id.Value);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            var model = new InvoiceTabModel
            {
                DocumentId = docs.First(),
                DataJson = apConfig.GetAppDataJson()
            };

            ViewBag.PageName = OdissHelper.GetDocumentApplication(id.Value);

            return View(model);
        }

        [CustomActionFilter(CustomActionFilterEnum.AppHeader)]
        [ChildActionOnly]
        public ActionResult AppHeader(Core.Entities.Application.Application application)
        {
            return View();
        }

        [CustomActionFilter(CustomActionFilterEnum.AppFooter)]
        [ChildActionOnly]
        public ActionResult AppFooter(Guid? id, Core.Entities.Application.Application application)
        {
            var authPrincipal = Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.AuthPrincipalHelper.GetAuthPrincipalFromClaims(HttpContext);
            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(authPrincipal, id.Value);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            var exceptionsApp = ConfigBase.Settings.Applications.FilterForLoggedUser(authPrincipal).FirstOrDefault(x => x.ID == Guid.Parse("32567291-0BED-E811-822B-D89EF34A256D"));

            ViewBag.AppData = apConfig.GetAppDataJson();
            ViewBag.PageName = OdissHelper.GetDocumentApplication(application.ID);
            ViewBag.ExceptionsPageUrl = exceptionsApp != null ? Url.Action("Index", "App", new { exceptionsApp.ID }) : string.Empty;

            return View();
        }
    }
}