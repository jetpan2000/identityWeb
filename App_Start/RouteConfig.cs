using Octacom.Odiss.Library.Config;
using System.Linq;
using System.Web.Mvc;
using System.Web.Routing;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            // Ignore route used by Octacom.Viewer
            routes.IgnoreRoute("{*octviewer}", new { octviewer = @"octviewer/(.*)?" });

            routes.MapMvcAttributeRoutes();

            routes.MapRoute(name: "Blank", url: "blank", defaults: new { controller = "Home", action = "Blank" });
            routes.MapRoute(name: "ViewerLocal", url: "app/viewerlocal", defaults: new { controller = "App", action = "ViewerLocal" });
            routes.MapRoute(name: "Document", url: "app/{id}/doc/{file}", defaults: new { controller = "App", action = "Doc" });
            routes.MapRoute(name: "DocumentSubmit", url: "app/{id}/docsubmit/{file}", defaults: new { controller = "App", action = "DocSubmit" });

            if (ConfigBase.Settings?.Applications != null && ConfigBase.Settings.Applications.Length > 0)
            {
                var appsWithNoDefaultViewer = ConfigBase.Settings.Applications
                    .Where(a =>
                        (a.Custom?.IgnoreDefaultViewer ?? false) &&
                        a.Type != Library.ApplicationTypeEnum.Workflow &&
                        !string.IsNullOrEmpty(a.Custom?.Controller) &&
                        !string.IsNullOrEmpty(a.Custom?.Namespace)
                    );

                foreach (var customApp in appsWithNoDefaultViewer)
                {
                    routes.MapRoute(name: "ViewerBase-" + customApp.ID, url: $"app/{customApp.ID}/viewerbase", defaults: new { controller = customApp.Custom.Controller, action = "ViewerBase", id = customApp.ID }, namespaces: customApp.Custom.Namespace.Split(','));
                }
            }

            routes.MapRoute(name: "ViewerBase", url: "app/{id}/viewerbase", defaults: new { controller = "App", action = "ViewerBase" });
            routes.MapRoute(name: "Viewer", url: "app/{id}/viewer", defaults: new { controller = "App", action = "Viewer" });
            routes.MapRoute(name: "ViewerBrowserNative", url: "app/{id}/viewerbrowsernative", defaults: new { controller = "App", action = "ViewerBrowserNative" });
            routes.MapRoute(name: "GetAutoCompleteList", url: "app/{id}/GetAutoCompleteList/{source}/{code}", defaults: new { controller = "App", action = "GetAutoCompleteList" });

            // Temporary protected/public documents
            routes.MapRoute(name: "ViewerProtectedDoc", url: "protected/{id}/{id1}/{id2}/{file}", defaults: new { controller = "App", action = "ViewerProtectedDoc" });
            routes.MapRoute(name: "ViewerProtected", url: "protected/{id}/{id1}/{id2}", defaults: new { controller = "App", action = "ViewerProtected" });

            // Add custom apps
            if (ConfigBase.Settings?.Applications != null && ConfigBase.Settings.Applications.Length > 0)
            {
                var customApps = ConfigBase.Settings.Applications
                    .Where(a =>
                        (a.Type == Library.ApplicationTypeEnum.Custom || a.Type == Library.ApplicationTypeEnum.Workflow) &&
                        a.Custom != null &&
                        !string.IsNullOrEmpty(a.Custom.Controller) &&
                        !string.IsNullOrEmpty(a.Custom.Namespace)
                    );

                foreach (var customApp in customApps)
                {
                    if (customApp.Custom.SemiCustom)
                    {
                        routes.MapRoute(name: "AppCustom-" + customApp.ID, url: $"app/{customApp.ID}/custom/" + "{action}", defaults: new { controller = customApp.Custom.Controller, action = customApp.Custom.Action, id = customApp.ID }, namespaces: customApp.Custom.Namespace.Split(','));
                    }
                    else
                    {
                        routes.MapRoute(name: "App-" + customApp.ID, url: $"app/{customApp.ID}/" + "{action}", defaults: new { controller = customApp.Custom.Controller, action = customApp.Custom.Action, id = customApp.ID }, namespaces: customApp.Custom.Namespace.Split(','));
                    }
                }
            }

            routes.MapRoute(name: "Workflow", url: "wf/{id}/{action}", defaults: new { controller = "Workflow", action = "Index" }, namespaces: new[] { "Octacom.Odiss.ABCgroup.Web.Controllers" });
            routes.MapRoute(name: "App", url: "app/{id}/{action}", defaults: new { controller = "App", action = "Index" });
            routes.MapRoute(name: "APForm", url: "apform/{id}/{action}", defaults: new { controller = "APForm", action = "Index" });
            routes.MapRoute(name: "EditForm", url: "editform/{id}/{action}", defaults: new { controller = "EditForm", action = "Index" });
            routes.MapRoute(name: "Logo", url: "logo", defaults: new { controller = "Home", action = "Logo" });
            routes.MapRoute(name: "ChangeLanguage", url: "change-language", defaults: new { controller = "Home", action = "ChangeLanguage" });
            routes.MapRoute(name: "Reports", url: "reports/{action}/{id}", defaults: new { controller = "Reports", action = "Index", id = UrlParameter.Optional }, namespaces: new[] { "Octacom.Odiss.ABCgroup.Web.Controllers" });
            routes.MapRoute(name: "Upload", url: "upload/{id}/{action}", defaults: new { controller = "Upload", action = "Index" });

            // Words resource
            routes.MapRoute(name: "Words", url: "content/js/words_js", defaults: new { controller = "Home", action = "Words" });

            // Default
            routes.MapRoute(name: "OdissBaseDefault", url: "{controller}/{action}/{id}", defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional });
        }
    }
}