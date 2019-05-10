using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Config;
using Octacom.Odiss.ABCgroup.Web.Globalization;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    [Authorize]
    public class EditFormController : Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.BaseController
    {
        /// <summary>
        /// Index page for Applications
        /// </summary>
        /// <param name="id">Application ID (Guid)</param>
        /// <param name="model">Submitted data (Search)</param>
        /// <returns></returns>
        [Menu(MenuEnum.Application)]
        public ActionResult Index(Guid? id, FormCollection model)
        {
            ViewBag.AppActive = id;

            if (!id.HasValue) return View();

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null) return View();

            EditForm editform = new EditForm
            {
                ID = id.Value,
                Name = apConfig.Name,
                Fields = apConfig.Fields,
                Config = apConfig
            };
            //editform.FieldsItems = apConfig.FieldsItems;
            //editform.FieldsSummary = apConfig.FieldsSummary;
            //editform.FieldsComment = apConfig.FieldsComment;

            if (model != null && model.Count != 0)
                editform.Results = EditDocuments.EditGetResults(apConfig, model, User);

            editform.FormState = model;

            return View(editform);
        }

        public JsonResult SearchAutoComplete(string query, string appid, string mapTo)
        {
            Guid AppGuid = Guid.Parse(appid.Substring(appid.IndexOf(@"editform/") + 9));

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, AppGuid);

            if (apConfig == null)
            {
                return null;
            }
            App app = new App()
            {
                ID = AppGuid,
                Name = apConfig.Name,
                Fields = apConfig.Fields,
                Config = apConfig
            };


            return Json(new
            {
                query = query,
                suggestions = Documents.SearchAutoComplete(query, app, mapTo)
            }, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Show the page containing the features: Properties, Edit properties, Notes, E-mail
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="docs">Documents ID</param>
        /// <returns></returns>
        public ActionResult ViewerBase(Guid id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs)
        {
            return getViewerBase(id, docs, false);
        }

        public ActionResult ViewerBaseButton(Guid id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs)
        {
            return getViewerBase(id, docs, true);
        }

        private ActionResult getViewerBase(Guid? id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs, bool IsButton)
        {
            if (id.HasValue)
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (apConfig != null && User.HasPermission(UserPermissionsEnum.ViewDocuments))
                {
                    EditForm app = new EditForm
                    {
                        ID = id.Value,
                        Name = apConfig.Name,
                        Fields = apConfig.Fields,
                        DocsID = docs,
                        Config = apConfig
                    };
                    //app.FieldsItems = apConfig.FieldsItems;
                    //app.FieldsSummary = apConfig.FieldsSummary;
                    //app.FieldsComment = apConfig.FieldsComment;
                    app.MultipleDocuments = app.DocsID.Length > 1;
                    //app.TotalPages = new OctaDocument(new Documents() { AppID = id, List = docs }).GetPageCount();

                    // Show notes and properties only returning one document
                    if (app.DocsID.Length == 1)
                    {
                        app.Notes = Note.GetAll(apConfig, app.DocsID.First());
                        app.Result = Documents.GetResult(apConfig, app.DocsID.First());
                        //app.ResultItems = APDocuments.GetResultItems(apConfig, app.DocsID.First());

                        Dictionary<string, object> properties = new Dictionary<string, object>();

                        foreach (var field in app.Fields)
                            if (app.Result.Keys.Any(a => a == field.DBColumnName))
                            {
                                properties.Add(field.Name.ToLanguage(), app.Result[field.DBColumnName]);
                            }

                        Audit.Save(new Audit() { Action = AuditTypeEnum.ViewDocument, IDApplication = apConfig.ID, Data = properties, Ref = new { Guids = app.DocsID } });
                    }
                    else
                    {
                        Audit.Save(new Audit() { Action = AuditTypeEnum.ViewDocument, IDApplication = apConfig.ID, Ref = new { Guids = app.DocsID } });
                    }

                    return View("~/Views/EditForm/ViewerBase.cshtml", app);
                }
            }

            return View("~/Views/EditForm/ViewerBase.cshtml");
        }

        /// <summary>
        /// Show the page to submit documents
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <returns></returns>
        public ActionResult SubmitBase(Guid? id)
        {
            if (!id.HasValue) return View();

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null || !apConfig.EnableSubmitDocuments ||
                !User.HasPermission(UserPermissionsEnum.SubmitDocuments))
                return View();

            EditForm editform = new EditForm
            {
                ID = id.Value,
                Name = apConfig.Name,
                Fields = apConfig.Fields,
                Config = apConfig
            };
            //editform.FieldsItems = apConfig.FieldsItems;
            //editform.FieldsSummary = apConfig.FieldsSummary;
            //editform.FieldsComment = apConfig.FieldsComment;

            return View("~/Views/EditForm/ViewerBase.cshtml", editform);
        }

        ///TODO
        public ActionResult SubmitBaseMultiple(Guid? id)
        {
            if (!id.HasValue) return View();

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null || !apConfig.EnableSubmitDocuments ||
                !User.HasPermission(UserPermissionsEnum.SubmitDocuments))
                return View();

            App app = new App
            {
                ID = id.Value,
                Name = apConfig.Name,
                Fields = apConfig.Fields,
                Config = apConfig
            };

            return View(app);
        }

        // <summary>
        // Show the page that loads the document
        // </summary>
        // <param name="id">Application ID</param>
        // <param name="docs">Document IDs</param>
        // <returns></returns>
        //public ActionResult Viewer(Guid id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs)
        //{
        //    if (id != null)
        //    {
        //        var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id);

        //        if (apConfig != null && User.HasPermission(UserPermissionsEnum.ViewDocuments))
        //        {
        //            App app = new App();
        //            app.ID = id;
        //            app.DocsID = docs;
        //            app.Name = apConfig.Name;

        //            return View(app);
        //        }
        //    }

        //    return View();
        //}

        //public ActionResult ViewerBrowserNative(Guid id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs)
        //{
        //    if (id != null)
        //    {
        //        var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id);

        //        if (apConfig != null && User.HasPermission(UserPermissionsEnum.ViewDocuments))
        //        {
        //            App app = new App();
        //            app.ID = id;
        //            app.DocsID = docs;
        //            app.Name = apConfig.Name;

        //            return View(app);
        //        }
        //    }

        //    return View();
        //}

        // <summary>
        // Show the page that loads the temporary document
        // </summary>
        // <param name="id">Application ID</param>
        // <returns></returns>
        //public ActionResult ViewerSubmit(Guid id)
        //{
        //    if (id != null)
        //    {
        //        var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id);

        //        if (apConfig != null && User.HasPermission(UserPermissionsEnum.SubmitDocuments))
        //        {
        //            return View(new App()
        //            {
        //                ID = id,
        //                Name = apConfig.Name
        //            });
        //        }
        //    }

        //    return View();
        //}

        /// <summary>
        /// Load the document(s) file(s)
        /// </summary>
        /// <param name="documents"></param>
        /// <returns></returns>
        [HttpPost]
        public ActionResult Doc(Documents documents)
        {
            if (documents.AppID == default(Guid)) return null;

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, documents.AppID);

            if (apConfig != null && ModelState.IsValid && User.HasPermission(UserPermissionsEnum.ViewDocuments))
            {
                return new OctaDocument(documents, User);
            }

            return null;
        }

        /// <summary>
        /// Load the temporary document file
        /// </summary>
        /// <param name="documents"></param>
        /// <returns></returns>
        [HttpPost]
        public ActionResult DocSubmit(Documents documents)
        {
            if (documents.AppID == default(Guid)) return null;

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, documents.AppID);

            if (apConfig != null && ModelState.IsValid && User.HasPermission(UserPermissionsEnum.SubmitDocuments))
            {
                return new OctaDocument(documents, User, true);
            }

            return null;
        }

        #region Ajax Requests

        #region Submit

        /// <summary>
        /// Save a temporary file
        /// </summary>
        /// <param name="id">App ID</param>
        /// <returns>Temporary file GUID</returns>
        public JsonResult PreSubmit(Guid id)
        {
            foreach (string fileName in Request.Files)
            {
                HttpPostedFileBase file = Request.Files[fileName];

                if (file != null && file.ContentLength > 0)
                {
                    string uploadedFileName = string.Join("_", file.FileName.Split(Path.GetInvalidFileNameChars())); // Replace invalid characters;
                    Guid tempID = Guid.NewGuid();
                    string tempFileName = tempID.ToString() + Path.GetExtension(file.FileName);

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

                    return Json(tempID);
                }
            }

            return Json(true);
        }

        /// <summary>
        /// Save a new document with properties and file
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="fc">Submitted data (properties)</param>
        /// <returns></returns>
        public JsonResult Submit(Guid? id, FormCollection fc)
        {
            if (id.HasValue)
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (apConfig != null && User.HasPermission(UserPermissionsEnum.SubmitDocuments))
                {
                    string basePath = Path.Combine(
                        Path.Combine(ConfigBase.Settings.TemporarySubmitFilesPath, id.ToString()),
                            User.ID.ToString());

                    var result = Documents.SaveNewFile(apConfig, fc["TemporaryFileID"], fc, basePath, User);

                    return Json(new { status = result });
                }
            }

            return Json(true);
        }

        #endregion

        #region Viewer Actions

        // <summary>
        // Save audit data when user is saving a document using the new viewer
        // </summary>
        // <param name="id">Application ID</param>
        // <param name="docs">Document IDs</param>
        // <returns></returns>
        //public JsonResult SaveActionDownload(Guid id, Guid[] docs)
        //{
        //    Audit.Save(new Audit() { Action = AuditTypeEnum.SaveDocument, IDApplication = id, Ref = new { Guids = docs } });

        //    return Json(new { status = true });
        //}

        // <summary>
        // Save audit data when user is printing a document using the new viewer
        // </summary>
        // <param name="id">Application ID</param>
        // <param name="docs">Document IDs</param>
        // <returns></returns>
        //public JsonResult SaveActionPrint(Guid id, Guid[] docs)
        //{
        //    Audit.Save(new Audit() { Action = AuditTypeEnum.PrintDocument, IDApplication = id, Ref = new { Guids = docs } });

        //    return Json(new { status = true });
        //}

        #endregion

        #region Edit

        public JsonResult Delete(Guid? id, FormCollection fc)
        {
            if (!id.HasValue) return Json(new { status = false });

            var apCurrentConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);
            var apConfig = apCurrentConfig;

            if (apConfig != null && User.HasPermission(UserPermissionsEnum.EditProperties))
            {
                return Json(new { status = EditDocuments.Delete(apConfig, fc["guid"], fc) });
            }

            return Json(new { status = false });
        }

        /// <summary>
        /// Edit document properties (save)
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="fc">Submitted changes (properties)</param>
        /// <returns></returns>
        public JsonResult Edit(Guid? id, FormCollection fc)
        {
            if (!id.HasValue) return Json(new { status = false });

            var apCurrentConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);
            var apConfig = apCurrentConfig;

            if (fc["hFormType"] == "button")
            {
                apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, apCurrentConfig.GetInvoiceApplicationID());
            }

            if (apConfig == null || !User.HasPermission(UserPermissionsEnum.EditProperties))
                return Json(new { status = false });

            if (!string.IsNullOrEmpty(fc["TemporaryFileID"]))
            {
                string basePath = Path.Combine(
                    Path.Combine(ConfigBase.Settings.TemporarySubmitFilesPath, id.ToString()),
                    User.ID.ToString());

                Documents.SaveNewFile(apConfig, fc["TemporaryFileID"], fc, basePath, User);
            }

            var result = EditDocuments.EditSaveEdit(apConfig, fc["guid"], fc);

            return Json(new { status = result });
        }

        #endregion

        #region Auto Complete

        /// <summary>
        /// Autocomplete request
        /// </summary>
        /// <param name="id">Application ID (Guid)</param>
        /// <param name="name">Field name</param>
        /// <param name="value">Value informed by user</param>
        /// <returns></returns>
        public JsonResult AutoComplete(Guid? id, string name, string value)
        {
            if (!id.HasValue) return Json(new { status = false });

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (!User.HasPermission(UserPermissionsEnum.EditProperties)) return Json(new { status = false });

            var field = apConfig.Fields.FirstOrDefault(a => a.ViewColumnID == name);

            var result = Documents.GetAutoComplete(apConfig, field, value);

            if (result != null)
            {
                return Json(new { status = true, result = result });
            }

            return Json(new { status = false });
        }

        #endregion

        #region Notes

        /// <summary>
        /// Get all notes for a specific document
        /// </summary>
        /// <param name="id">Application ID (Guid)</param>
        /// <param name="idd">Document ID (Guid)</param>
        /// <returns></returns>
        public ContentResult GetNotes(Guid id, Guid idd)
        {
            if (id != default(Guid) && idd != default(Guid) && User.HasPermission(UserPermissionsEnum.ViewNotes))
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id);

                if (apConfig != null)
                {
                    IEnumerable<Note> allNotes = Note.GetAll(apConfig, idd);

                    if (allNotes != null && allNotes.Any())
                    {
                        string content = string.Empty;

                        int count = 1;
                        int totalNotes = allNotes.Count();

                        foreach (var note in allNotes.Take(5))
                        {
                            content += string.Format("{0}<br /><small style='color:#ccc;'>{1} {2} - {3} {4} {5}</small>", note.Text,
                                Words.Notes_WroteBy, note.Author,
                                note.Created.ToString(ConfigBase.Settings.DateFormat), Words.Notes_At, note.Created.ToString("hh:mm:sstt")
                                );

                            if (count != allNotes.Take(5).Count())
                            {
                                content += "<hr style='margin:5px 0px;' />";
                            }

                            count++;
                        }

                        if (totalNotes > 5)
                        {
                            content += "<hr style='margin:5px 0px;' />";
                            content += "<small><strong>" + Words.Notes_SeeMore + "</strong></small>";
                        }

                        return Content(content, "text/html");
                    }
                }
            }

            return Content(null);
        }

        /// <summary>
        /// Delete a note
        /// </summary>
        /// <param name="id">Application ID (Guid)</param>
        /// <param name="idNote">Note ID (Guid)</param>
        /// <returns></returns>
        public JsonResult DeleteNote(Guid id, Guid idNote)
        {
            if (id != default(Guid) && idNote != default(Guid) && User.HasPermission(UserPermissionsEnum.DeleteNotes))
            {
                var apConfig = ConfigBase.Settings.Applications.FilterForLoggedUser(User).FirstOrDefault(a => a.ID == id);

                bool deleted = Note.Delete(apConfig, idNote);

                return Json(new { status = deleted });
            }

            return Json(new { status = false });
        }

        /// <summary>
        /// Add a new note
        /// </summary>
        /// <param name="id">Application ID (Guid)</param>
        /// <param name="doc">Document ID (Guid)</param>
        /// <param name="text">Text note</param>
        /// <returns></returns>
        public JsonResult SaveNote(Guid? id, Guid doc, string text)
        {
            if (id.HasValue) // Valid decryption
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (doc != default(Guid) && User.HasPermission(UserPermissionsEnum.AddNotes))
                {
                    string author = User.UserName;
                    Note saved = Note.Save(apConfig, doc, author, text);

                    if (saved != null)
                    {
                        return Json(new { status = true, note = saved });
                    }
                }
            }

            return Json(new { status = false });
        }

        #endregion

        #region E-mail

        /// <summary>
        /// Send documents via e-mail
        /// </summary>
        /// <param name="id">Application ID (Guid)</param>
        /// <param name="fc">Form data (to, subject, text, etc)</param>
        /// <param name="docs">Document IDs to send</param>
        /// <returns></returns>
        public JsonResult Email(Guid? id, FormCollection fc, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs)
        {
            if (id.HasValue) // Valid decryption
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (User.HasPermission(UserPermissionsEnum.ViewDocuments) && User.HasPermission(UserPermissionsEnum.EmailDocument))
                {
                    Documents doc = new Documents
                    {
                        AppID = id.Value,
                        List = docs
                    };
                    doc.LoadFiles();

                    var result = Documents.Email(apConfig, fc, doc);

                    return Json(new { status = result });
                }
            }

            return Json(new { status = false });
        }

        #endregion

        #endregion
    }
}