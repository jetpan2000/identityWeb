using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Config;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    [Authorize]
    public class UploadController : Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.BaseController
    {
        [Menu(MenuEnum.Application)]
        public ActionResult Index(AppIndex model)
        {
            if (!model.ID.HasValue)
            {
                return new HttpNotFoundResult();
            }

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, model.ID.Value);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            App app = new App
            {
                ID = model.ID.Value,
                Name = apConfig.Name,
                Fields = apConfig.Fields,
                Config = apConfig
            };

            ViewBag.AppActive = model.ID;
            ViewBag.AppName = app.Config.Name;

            return View(app);
        }

        public JsonResult PreSubmit(Guid? id)
        {
            if (id.HasValue)
            {
                foreach (string fileName in Request.Files)
                {
                    HttpPostedFileBase file = Request.Files[fileName];

                    if (file != null && file.ContentLength > 0)
                    {
                        string uploadedFileName = string.Join("_", file.FileName.Split(Path.GetInvalidFileNameChars())); // Replace invalid characters;
                        string randomNr = DateTime.Now.Ticks.ToString();
                        string tempId = Path.GetFileNameWithoutExtension(uploadedFileName) + "_" + randomNr.Substring(randomNr.Length - 5);
                        string tempFileName = tempId + Path.GetExtension(file.FileName);

                        string basePath = Path.Combine(
                            Path.Combine(ConfigBase.Settings.TemporarySubmitFilesPath, id.ToString()),
                                User.ID.ToString());

                        if (!Directory.Exists(basePath))
                            Directory.CreateDirectory(basePath);
                        else
                        {
                            // Check if there are any pending file and delete all of them
                            string[] pendingFiles = Directory.GetFiles(basePath);

                            if (pendingFiles.Length > 0)
                            {
                                foreach (var pendingFile in pendingFiles)
                                {
                                    try
                                    {
                                        System.IO.File.Delete(pendingFile);
                                    }
                                    catch (Exception ex)
                                    {
                                        ex.Log();
                                    }
                                }
                            }
                        }

                        file.SaveAs(Path.Combine(basePath, tempFileName));

                        return Json(tempId);
                    }
                }
            }

            return Json(false);
        }

        public JsonResult Submit(Guid? id, FormCollection fc)
        {
            if (!id.HasValue) return Json(new { status = false });

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null || !User.HasPermission(UserPermissionsEnum.SubmitDocuments))
                return Json(new { status = false });

            string basePath = Path.Combine(ConfigBase.Settings.TemporarySubmitFilesPath, id.ToString(), User.ID.ToString());

            var result = Upload.Send(apConfig, fc["TemporaryFileID"], fc, basePath, User);

            return Json(new { status = result });
        }
    }
}