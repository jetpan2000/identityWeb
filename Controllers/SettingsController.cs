using Newtonsoft.Json;
using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Config;
using System;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.Mvc;
using System.Web.Script.Serialization;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    [Authorize(Roles = "Octacom")]
    public class SettingsController : Controller
    {
        public ActionResult Index()
        {
            if (!Settings.IsSetupEnabled)
                throw new HttpException(404, "Page not found");

            return View();
        }

        public ContentResult Basic()
        {
            if (!Settings.IsSetupEnabled)
                throw new HttpException(404, "Page not found");

            var settings = new Settings();
            settings.Load();

            return Content(
                JsonConvert.SerializeObject(settings,
                    Formatting.Indented,
                    new JsonSerializerSettings()
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore
                    }),
                "application/json");
        }

        public JsonResult Save(string changes, Settings baseSettings, Settings settings)
        {
            try
            {
                // 'changes' variable wasn't being converted correctly using the class SetingsChange.
                // changed to string and after deserialize it
                var changes2 = new JavaScriptSerializer().Deserialize<SettingsChange[]>(changes);

                return Json(new { status = Settings.SaveChanges(changes2, baseSettings, settings) });
            }
            catch (Exception ex)
            {
                ex.Log();
                return Json(new { status = false, ex = ex.Message });
            }
        }

        public JsonResult GetColumns(string server, string dbschema, string user, string pass, Guid appID)
        {
            return Json(Settings.GetColumns(server, dbschema, user, pass, appID).Select(a => new
            {
                ColumnName = a.COLUMN_NAME,
                DataType = a.DATA_TYPE,
                Size = a.CHARACTER_MAXIMUM_LENGTH
            }).ToArray());
        }

        public JsonResult Check(int type, Settings settings)
        {
            try
            {
                switch (type)
                {
                    case 0:
                        return Json(settings.ValidateDatabaseConnection());
                    case 1:
                        return Json(settings.ValidateMainDatabaseStructure());
                    case 2:
                        return Json(settings.ValidateImageViewer(this));
                    case 3:
                        return Json(settings.ValidateImagePaths());
                }

                Thread.Sleep(1000);
                return Json(new { IsValid = type % 2 == 0 });

            }
            catch (Exception ex)
            {
                ex.Log();
                return Json(new { status = false, ex = ex.Message });
            }
        }

        public JsonResult ResetData()
        {
            try
            {
                ConfigBase.Settings.ResetData();

                return Json(new { status = true });
            }
            catch (Exception ex)
            {
                ex.Log();
                return Json(new { status = false, ex = ex.Message });
            }
        }

        public JsonResult Refresh()
        {
            try
            {
                ConfigBase.Settings.UpdateApplicationSettings();

                return Json(new { status = true });
            }
            catch (Exception ex)
            {
                ex.Log();
                return Json(new { status = false, ex = ex.Message });
            }
        }
    }
}