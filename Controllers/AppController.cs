using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Auth;
using Octacom.Odiss.Library.Config;
using Octacom.Odiss.Library.Utils;
using Octacom.Odiss.ABCgroup.Web.Globalization;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web;
using System.Web.Mvc;
using Octacom.Odiss.Library.Custom;
using Dapper;
using Octacom.Odiss.ABCgroup.Web.Models;
using Octacom.Odiss.ABCgroup.Web.Code;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.Invoice;
using Octacom.Odiss.ABCgroup.Business.Services;
using Octacom.Odiss.Odiss5Adapters;
using Octacom.Odiss.ABCgroup.Entities.Invoice.DocumentResults;
using Octacom.Odiss.Core.Contracts.Settings;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Net.Mime;
using System.Globalization;
using System.Text;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    [Authorize]
    public class AppController : Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.BaseController
    {
        private readonly ISettingsService settingsService;
        private readonly IApplicationService applicationService;
        private readonly IDocumentInvoiceRepository invoiceRepository;
        private readonly Core.Contracts.Services.IStorageService storageService;
        private readonly IABCUserService userService;
        private readonly IDocumentsAdapter documentsAdapter;

        public AppController(ISettingsService settingsService, IApplicationService applicationService, IDocumentInvoiceRepository invoiceRepository, Core.Contracts.Services.IStorageService storageService, IABCUserService userService, IDocumentsAdapter documentsAdapter)
        {
            this.settingsService = settingsService;
            this.applicationService = applicationService;
            this.invoiceRepository = invoiceRepository;
            this.storageService = storageService;
            this.userService = userService;
            this.documentsAdapter = documentsAdapter;
        }

        /// <summary>
        /// Index page for Applications
        /// </summary>
        /// <param name="model">App Index model</param>
        /// <returns></returns>
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

            if (apConfig.Type == ApplicationTypeEnum.DataGrid)
            {
                var appSettings = settingsService.Get();
                var application = applicationService.Get(model.ID.Value.ToString());

                var dataJson = JsonConvert.SerializeObject(application, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    StringEscapeHandling = StringEscapeHandling.EscapeHtml,
                    ContractResolver = new CamelCasePropertyNamesContractResolver(),
                    Converters = new[] { new ApplicationJsonConverter() }
                });

                var gridModel = new DataGridModel
                {
                    DataJson = dataJson,
                    RowsPerPage = appSettings.MaxPerPage
                };

                ViewBag.NoAngular = true;
                return View("DataGrid", gridModel);
            }

            if (model.Form != null && model.Form.Count != 0)
            {
                if (!model.Page.HasValue)
                {
                    model.Page = 1;
                }

                int page = model.Page.Value;
                if (model.Exporting == "1" && page == 0)
                    page = 1;

                dynamic queryResult = documentsAdapter.GetResults(apConfig, model.Form, User, page, model.Sort);

                if (!string.IsNullOrWhiteSpace(model.Exporting) && model.Exporting == "1")
                {
                    if (UserPermissionsEnum.ExportResults.IsUserAuthorized(User))
                    {
                       //  Documents.ExportResults(apConfig, model.Form, User, model.Page.Value, model.Sort);
                        ExportResults(queryResult, apConfig, model.Form, 1, null);
                    }

                    return null;
                }
                else
                {
                    return Json(queryResult);
                    //return Json(Documents.GetResults(apConfig, model.Form, User, model.Page.Value, model.Sort));
                }
            }

            App app = new App()
            {
                ID = model.ID.Value,
                Name = apConfig.Name,
                Fields = apConfig.Fields,
                FieldsSettingJson = Utils.GetFieldsJson(apConfig.Fields),
                Config = apConfig,
                FormState = model.Form
            };

            ViewBag.AppActive = model.ID;

            if (apConfig.Custom?.HideTab ?? false)
            {
                if (ConfigBase.Settings.Applications.FilterForLoggedUser(User)
                    .Any(a => a.ID == apConfig.Custom?.SubApplicationId))
                {
                    ViewBag.AppActive = apConfig.Custom?.SubApplicationId;
                }
            }

            ViewBag.AppName = app.Config.Name;

            return View(app);
        }

        private void ExportResults(dynamic queryResult, Settings.Application app, FormCollection form, int cnt, Dictionary<string, object> values)
        {
            Audit.Save(AuditTypeEnum.Export, app.ID, new { Records = cnt, Values = values });

            var context = System.Web.HttpContext.Current.Response;
            context.Buffer = context.BufferOutput = false;
            context.Cache.SetCacheability(HttpCacheability.Private);
            context.Cache.SetExpires(DateTime.Now);
            context.ContentType = new ContentType("text/csv") { CharSet = "utf-8" }.ToString();
            context.AppendHeader("Content-Disposition",
                new ContentDisposition
                {
                    DispositionType = DispositionTypeNames.Attachment,
                    FileName = string.Format(CultureInfo.InvariantCulture, "Export{0:yyyyMMddffffff}.csv", DateTime.Now)
                }.ToString()
            );
            context.AppendHeader("X-Content-Type-Options", "nosniff");

            var fcDictionary = form.AllKeys.ToDictionary(k => k, v => (object)form[v]);

            var fieldsOrdered = app.Fields
                  .FilterByFieldsEvent(fcDictionary, false)
                  .Where(a => (a.VisibilityType == FieldVisibilityTypeEnum.Always || a.VisibilityType == FieldVisibilityTypeEnum.SearchResults || a.VisibilityType == FieldVisibilityTypeEnum.OnlySearchResults) && a.Type != FieldTypeEnum.Button && !a.NotVisibleExport)
                  .Where(a => a.Settings == null || (a.Settings != null && !a.Settings.DisableExport)) // Disable export for this field
                  .OrderBy(a => a.ResultOrder)
                  .ToArray();

            List<List<string>> dataTableResults = new List<List<string>>();

            foreach (var row in queryResult.data)
            {
                List<string> dataRow = new List<string>();
                //dataRow.Add(row["GUID"].ToString()); // Checkbox column (GUID)
                int col = 1;
                foreach (var field in fieldsOrdered)
                {
                    dataRow.Add((string)row[col++]);
                }

                dataTableResults.Add(dataRow);
            }

            using (BufferedStream stm = new BufferedStream(context.OutputStream, 1024 * 1024))
            {
                using (StreamWriter wr = new StreamWriter(stm, Encoding.UTF8))
                {
                    wr.AutoFlush = false;

                    List<string> headerColumns = new List<string>();

                    foreach (var field in fieldsOrdered)
                    {
                        headerColumns.Add(field.Name.ToLanguage());
                    }

                    // Write header
                    WriteColumns(wr, headerColumns.ToArray());

                    foreach (List<string> row in dataTableResults)
                    {
                        WriteColumns(wr, row.ToArray());
                    }
                }
            }
        }

        private static void WriteColumns(StreamWriter wr, string[] columns)
        {
            for (int i = 0; i < columns.Length; i++)
            {
                if (i == 0) // First column
                {
                    wr.Write('\"');
                }
                else
                {
                    wr.Write("\",\"");
                }

                string s = columns[i];

                wr.Write(string.IsNullOrWhiteSpace(s) ? string.Empty : s.Replace("\"", "\"\""));
            }

            wr.WriteLine('\"');
        }

        [Route("app/{appId}/InvoiceNoModal/{documentId}")]
        public ActionResult InvoiceNoModal(Guid appId, Guid documentId)
        {
            //return HttpNotFound(); // Disabling

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, appId);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            var model = new InvoiceTabModel
            {
                DocumentId = documentId,
                DataJson = apConfig.GetAppDataJson()
            };

            ViewBag.PageName = OdissHelper.GetDocumentApplication(appId);

            return View(model);
        }

        [Route("app/{appId}/SubmitInvoiceNoModal")]
        public ActionResult SubmitInvoiceNoMOdal(Guid appId)
        {
            //return HttpNotFound(); // Disabling

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, appId);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            var model = new InvoiceTabModel
            {
                DataJson = apConfig.GetAppDataJson()
            };

            ViewBag.PageName = OdissHelper.GetDocumentApplication(appId);

            return View(model);
        }

        #region Viewer

        /// <summary>
        /// Show the page containing the features: Properties, Edit properties, Notes, E-mail
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="docs">Documents ID</param>
        /// <param name="extra">Extra data</param>
        /// <returns></returns>
        public ActionResult ViewerBase(Guid? id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs, string extra = null)
        {
            if (!id.HasValue)
            {
                return new HttpNotFoundResult();
            }

            if (!User.HasPermission(UserPermissionsEnum.ViewDocuments))
            {
                return new HttpUnauthorizedResult();
            }

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            OctaDocument octDocument = null;

            if (!(apConfig.Custom?.IgnoreDefaultViewer ?? false))
                octDocument = new OctaDocument(new Documents() { AppID = id.Value, List = docs });

            App app = new App()
            {
                ID = id.Value,
                Name = apConfig.Name,
                Fields = apConfig.Fields,
                FieldsSettingJson = Utils.GetFieldsJson(apConfig.Fields),
                DocsID = docs,
                Config = apConfig,
                MultipleDocuments = docs.Length > 1,
                Extra = extra,
                TotalPages = octDocument?.GetPageCount() ?? 0,
                FileDetails = octDocument?.GetDocs()?.FileDetails
            };

            if (apConfig.Type == ApplicationTypeEnum.Workflow)
            {
                if (!app.MultipleDocuments)
                {
                    app.Workflow = Library.Workflow.WorkflowViewerViewModel.Get(apConfig, docs.First(), User.ID);
                }
            }

            if (apConfig.Custom != null && apConfig.Custom.GroupMultipleDocuments)
            {
                app.MultipleDocuments = false;
            }

            if (apConfig.Custom?.ViewerModule?.Sidebar != null)
            {
                if (apConfig.Custom.ViewerModule.Sidebar.Width != ViewerModule.SidebarModule.Size.Regular)
                {
                    if (apConfig.Custom.ViewerModule.Sidebar.Width == ViewerModule.SidebarModule.Size.Medium)
                    {
                        string sidebarClasses = "col-sm-5 col-md-4 col-lg-4 sidebar";
                        string contentClasses = "col-sm-7 col-sm-offset-5 col-md-8 col-md-offset-4 col-lg-8 col-lg-offset-4";

                        ViewBag.SidebarClasses = sidebarClasses;
                        ViewBag.ContentClasses = contentClasses;
                    }
                    else if (apConfig.Custom.ViewerModule.Sidebar.Width == ViewerModule.SidebarModule.Size.Large)
                    {
                        string sidebarClasses = "col-sm-6 col-md-5 col-lg-5 sidebar";
                        string contentClasses = "col-sm-6 col-sm-offset-6 col-md-7 col-md-offset-5 col-lg-7 col-lg-offset-5";

                        ViewBag.SidebarClasses = sidebarClasses;
                        ViewBag.ContentClasses = contentClasses;
                    }
                }
            }

            // Show notes and properties only returning one document
            if (!app.MultipleDocuments)
            {
                if (apConfig.EnableNotes)
                    app.Notes = Note.GetAll(apConfig, app.DocsID.First());

                if (!(apConfig.Custom?.IgnoreDefaultViewer ?? false))
                {
                    app.Result = Documents.GetResult(apConfig, app.DocsID.First(), User);

                    if (app.Result == null)
                        return new HttpNotFoundResult();
                }

                if (app.Result != null)
                {
                    Dictionary<string, object> properties = new Dictionary<string, object>();

                    List<Settings.Field> fieldsOrdered = app.Fields.Where(a => a.VisibilityType == FieldVisibilityTypeEnum.Always || a.VisibilityType == FieldVisibilityTypeEnum.SearchResults).OrderBy(a => a.ResultOrder).ToList();

                    foreach (var field in fieldsOrdered)
                    {
                        if (app.Result.Keys.Any(a => a == field.DBColumnName))
                        {
                            properties.Add(field.Name.ToLanguage(), app.Result.RenderValue(field, true));
                        }
                    }

                    Audit.Save(new Audit() { Action = AuditTypeEnum.ViewDocument, IDApplication = apConfig.ID, Data = properties, Ref = new { Guids = app.DocsID } });
                }
            }
            else
            {
                Audit.Save(new Audit() { Action = AuditTypeEnum.ViewDocument, IDApplication = apConfig.ID, Ref = new { Guids = app.DocsID } });
            }

            return View(app);
        }

        /// <summary>
        /// Show the page that loads the document
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="docs">Document IDs</param>
        /// <param name="fileLoad">File Load</param>
        /// <returns></returns>
        public ActionResult Viewer(Guid? id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs, string fileLoad, string customViewerUrl, string customViewerData, bool validateResult = true)
        {
            if (!id.HasValue)
            {
                return new HttpNotFoundResult();
            }

            if (!User.HasPermission(UserPermissionsEnum.ViewDocuments))
            {
                return new HttpUnauthorizedResult();
            }

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            App app = new App()
            {
                ID = id.Value,
                DocsID = docs,
                Name = apConfig.Name,
                Config = apConfig,
                FileLoad = fileLoad,
                CustomViewerUrl = customViewerUrl,
                CustomViewerData = customViewerData
            };

            /*
            Code below based on Yogesh's request from 2016/03/15 9:47AM:

            When a document is saved or email’ed
            As per the odiss requirements sent a long time back, require to
            1.	When a document is saved, the filename to be:
            <AppName>_<FirstFieldValue>.<ext>
            Where firstfieldvalue is the hyper linked value on the site for the app
            For e.g.
            Application: Application Name
            Firstfieldvalue: 22255559999666
            Filename to be: Application Name_22255559999666.PDF
            */
            if (app.DocsID.Length == 1)
            {
                app.Fields = apConfig.Fields;

                if (validateResult)
                {
                    app.Result = Documents.GetResult(apConfig, app.DocsID.First(), User);

                    if (app.Result == null)
                        return new HttpNotFoundResult();
                }

                string firstFieldName = app.Fields.Where(a => a.VisibilityType == FieldVisibilityTypeEnum.SearchResults || a.VisibilityType == FieldVisibilityTypeEnum.Always).OrderBy(a => a.ResultOrder).First().DBColumnName;

                try
                {
                    Settings.Field fieldWithAutoSearch = app.Fields
                        .Where(a => a.VisibilityType == FieldVisibilityTypeEnum.SearchResults ||
                                    a.VisibilityType == FieldVisibilityTypeEnum.Always)
                        .FirstOrDefault(a => a.Settings != null && a.Settings.AutoSearch);

                    if (fieldWithAutoSearch != null && app.Result != null &&
                        app.Result.ContainsKey(fieldWithAutoSearch.DBColumnName))
                    {
                        // Ignore if value has length <= 1
                        if (app.Result[fieldWithAutoSearch.DBColumnName].ToString().Length > 1)
                        {
                            app.AutoSearch = app.Result[fieldWithAutoSearch.DBColumnName].ToString();
                        }
                    }
                }
                catch (Exception ex)
                {
                    ex.Log();
                }

                string filenameSufix = Guid.NewGuid().ToString();

                if (app.Result?[firstFieldName] != null)
                {
                    filenameSufix = app.Result[firstFieldName].ToString();
                }

                app.DownloadDocName = string.Format("{0}_{1}.pdf", app.Name.ToLanguage(), filenameSufix);
            }
            else
            {
                app.DownloadDocName = app.Name.ToLanguage() + "_" + DateTime.Now.ToString("yyyyMMddHHmmssFFFF") + ".pdf";
            }

            Regex r = new Regex("(?:[^a-z0-9_.])", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);
            app.DownloadDocName = r.Replace(app.DownloadDocName, string.Empty);

            return View(app);
        }

        public ActionResult ViewerBrowserNative(Guid? id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs, int? startpage, int? endpage)
        {
            if (!id.HasValue)
            {
                return new HttpNotFoundResult();
            }

            if (!User.HasPermission(UserPermissionsEnum.ViewDocuments))
            {
                return new HttpUnauthorizedResult();
            }

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            App app = new App()
            {
                ID = id.Value,
                DocsID = docs,
                Name = apConfig.Name,
                PageRangeFrom = startpage ?? 0,
                PageRangeTotal = endpage ?? 0
            };

            return View(app);
        }

        /// <summary>
        /// Show the page that loads the temporary document
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="allowA">Allow anonymous access</param>
        /// <returns></returns>
        [AllowAnonymous]
        public ActionResult ViewerSubmit(Guid? id, bool allowA = false)
        {
            if (!id.HasValue)
            {
                return new HttpNotFoundResult();
            }

            Settings.Application apConfig;

            if (!allowA || Request.IsAuthenticated)
            {
                if (!Request.IsAuthenticated)
                {
                    return new HttpUnauthorizedResult();
                }

                if (!User.HasPermission(UserPermissionsEnum.SubmitDocuments))
                {
                    return new HttpUnauthorizedResult();
                }

                apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);
            }
            else
            {
                apConfig = ConfigBase.Settings.Applications.FirstOrDefault(a => a.ID == id.Value);
            }

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            if (allowA && !Request.IsAuthenticated && !new AuthAnonymous().CheckAnonymousAccess(apConfig.ID))
            {
                return new HttpUnauthorizedResult();
            }

            return View(new App()
            {
                ID = id.Value,
                Name = apConfig.Name
            });
        }

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

            if (apConfig != null &&
                userService.UserCanViewDocuments(documents.List) &&
                ModelState.IsValid)
            {
                return new OctaDocument(documents, User);
            }

            return null;
        }

        [AcceptVerbs(HttpVerbs.Get|HttpVerbs.Post)]
        [Route("app/{appId}/GetSupportingDocument/{supportingDocumentId}")]
        public ActionResult GetSupportingDocument(Guid appId, Guid supportingDocumentId)
        {
            var document = invoiceRepository.GetSupportingDocument(supportingDocumentId);

            if (document == null)
            {
                return HttpNotFound();
            }

            var file = storageService.GetDocumentFile(document);

            return File(file.AbsolutePath, "application/pdf", document.OriginalFilename);
        }

        /// <summary>
        /// Get the Download page
        /// </summary>
        public ActionResult ViewerDownload()
        {
            return View("~/Views/App/ViewerDownload.cshtml");
        }

        /// <summary>
        /// Open file directly from storage
        /// </summary>
        /// <param name="fileIdentification"></param>
        /// <param name="appIdentification"></param>
        /// <returns></returns>
        [HttpPost]
        public ActionResult OpenFile(Guid fileIdentification, Guid appIdentification)
        {
            if (appIdentification == default(Guid)) return null;

            Documents documents = new Documents()
            {
                AppID = appIdentification
            };

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, documents.AppID);

            if (apConfig == null || !User.HasPermission(UserPermissionsEnum.ViewDocuments)) return null;

            Guid[] guids = { fileIdentification };

            var doc = Documents.GetDocumentList(apConfig, guids).FirstOrDefault();

            if (doc == null) return null;

            byte[] fileBytes = System.IO.File.ReadAllBytes(doc);
            string fileName = Path.GetFileName(doc);

            return File(fileBytes, System.Net.Mime.MediaTypeNames.Application.Pdf, fileName);
        }

        #endregion

        #region Temporary Links

        /// <summary>
        ///
        /// </summary>
        /// <param name="id">ID Application</param>
        /// <param name="id1">ID Document</param>
        /// <param name="id2">ID Temporary Link</param>
        /// <returns></returns>
        [AllowAnonymous]
        public ActionResult ViewerProtected(Guid? id, Guid? id1, Guid? id2)
        {
            if (!id.HasValue || !id1.HasValue || !id2.HasValue)
            {
                return new HttpNotFoundResult();
            }

            var doc = TemporaryLink.Get(id.Value, id1.Value, id2.Value);

            if (doc == null)
            {
                return new HttpNotFoundResult();
            }

            var apConfig = ConfigBase.Settings.Applications.FirstOrDefault(a => a.ID == id.Value);

            if (apConfig == null)
            {
                return new HttpNotFoundResult();
            }

            App app = new App()
            {
                ID = id.Value,
                Ref = id2.Value,
                DocsID = new[] { id1.Value },
                Name = apConfig.Name
            };

            return View(app);
        }

        public ActionResult ViewerBase64(string base64)
        {
            ViewBag.Base64 = base64;
            return View();
        }

        [AllowAnonymous]
        public ActionResult ViewerProtectedDoc(Documents documents)
        {
            throw new NotImplementedException();

            //TODO: WIP
            /*
            if (documents.AppID != null && documents.AppID != default(Guid))
            {
                return ModelState.IsValid ? new OctaDocument(documents, User) : null;
            }

            return null;
            */
        }

        #endregion

        #region Upload

        /// <summary>
        /// Show the page to submit documents
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <returns></returns>
        public ActionResult SubmitBase(Guid? id)
        {
            if (!id.HasValue)
            {
                return new HttpNotFoundResult();
            }

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null || !apConfig.EnableSubmitDocuments)
            {
                return new HttpNotFoundResult();
            }

            if (!User.HasPermission(UserPermissionsEnum.SubmitDocuments))
            {
                return new HttpUnauthorizedResult();
            }

            App app = new App()
            {
                ID = id.Value,
                Name = apConfig.Name,
                Fields = apConfig.Fields,
                FieldsSettingJson = Utils.GetFieldsJson(apConfig.Fields),
                Config = apConfig
            };

            return View(app);
        }

        /// <summary>
        /// Load the temporary document file
        /// </summary>
        /// <param name="documents"></param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        public ActionResult DocSubmit(Documents documents)
        {
            if (documents.AppID == default(Guid)) return null;

            if (Request.IsAuthenticated)
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, documents.AppID);

                if (apConfig != null && ModelState.IsValid && User.HasPermission(UserPermissionsEnum.SubmitDocuments))
                {
                    return new OctaDocument(documents, User, true);
                }

                return null;
            }
            else
            {
                var apConfig = ConfigBase.Settings.Applications.FirstOrDefault(a => a.ID == documents.AppID);

                if (apConfig != null && ModelState.IsValid && new AuthAnonymous().CheckAnonymousAccess(apConfig.ID))
                {
                    return new OctaDocument(documents, User, true);
                }

                return null;
            }
        }

        #endregion

        #region Ajax Requests

        #region Submit

        /// <summary>
        /// Save a temporary file
        /// </summary>
        /// <param name="id">App ID</param>
        /// <returns>Temporary file GUID</returns>
        [AllowAnonymous]
        public JsonResult PreSubmit(Guid? id)
        {
            if (id.HasValue)
            {
                Guid userID = Guid.Empty;

                if (Request.IsAuthenticated)
                {
                    userID = User.ID;
                }
                else
                {
                    if (!new AuthAnonymous().CheckAnonymousAccess(id.Value))
                    {
                        return Json(false);
                    }
                }

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
                                userID.ToString());

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
            }

            return Json(false);
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
                    string basePath = Path.Combine(ConfigBase.Settings.TemporarySubmitFilesPath, id.ToString(), User.ID.ToString());

                    var result = Documents.SaveNewFile(apConfig, fc["TemporaryFileID"], fc, basePath, User);

                    return Json(new { status = result });
                }
            }

            return Json(new { status = false });
        }

        public JsonResult CleanSubmit(Guid? id, FormCollection fc)
        {
            if (!id.HasValue)
            {
                return Json(new { status = false });
            }

            var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

            if (apConfig == null)
            {
                return Json(new { status = false });
            }

            if (!User.HasPermission(UserPermissionsEnum.SubmitDocuments))
            {
                return Json(new { status = false });
            }

            try
            {
                string basePath = Path.Combine(ConfigBase.Settings.TemporarySubmitFilesPath, id.ToString(), User.ID.ToString());
                string filePath = Path.Combine(basePath, fc["TemporaryFileID"] + Path.GetExtension(fc["TemporaryFileName"]));

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    Thread.Sleep(800);
                }

                var tempUserFiles = Directory.EnumerateFiles(basePath);

                if (!tempUserFiles.Any())
                {
                    Directory.Delete(basePath);
                    Thread.Sleep(800);
                }

                if (!Directory.GetParent(basePath).EnumerateDirectories().Any())
                {
                    Directory.GetParent(basePath).Delete();
                    Thread.Sleep(800);
                }

                return Json(new { status = true });
            }
            catch (Exception ex)
            {
                ex.Log();
                return Json(new { status = false });
            }
        }

        #endregion

        #region Search

        public JsonResult SearchAutoComplete(string query, string appid, string mapTo)
        {
            Guid AppGuid = Guid.Parse(appid.TrimEnd('/').Substring(appid.IndexOf(@"app/") + 4));

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

            var suggestions = documentsAdapter.SearchAutoComplete(query, app, mapTo);

            return Json(new
            {
                query = query,
                suggestions
                //suggestions = Documents.SearchAutoComplete(query, app, mapTo)
            }, JsonRequestBehavior.AllowGet);
        }

        #endregion

        #region Viewer Actions

        /// <summary>
        /// Save audit data when user is saving a document using the new viewer
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="docs">Document IDs</param>
        /// <returns></returns>
        public JsonResult SaveActionDownload(Guid? id, Guid[] docs)
        {
            if (id.HasValue)
            {
                Audit.Save(new Audit() { Action = AuditTypeEnum.SaveDocument, IDApplication = id, Ref = new { Guids = docs } });

                return Json(new { status = true });
            }

            return Json(new { status = false });
        }

        /// <summary>
        /// Save audit data when user is printing a document using the new viewer
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="docs">Document IDs</param>
        /// <returns></returns>
        public JsonResult SaveActionPrint(Guid? id, Guid[] docs)
        {
            if (id.HasValue)
            {
                Audit.Save(new Audit() { Action = AuditTypeEnum.PrintDocument, IDApplication = id, Ref = new { Guids = docs } });

                return Json(new { status = true });
            }

            return Json(new { status = false });
        }

        #endregion

        #region Edit

        /// <summary>
        /// Edit document properties (save)
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="fc">Submitted changes (properties)</param>
        /// <returns></returns>
        public JsonResult Edit(Guid? id, FormCollection fc)
        {
            if (id.HasValue)
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (apConfig != null && User.HasPermission(UserPermissionsEnum.EditProperties))
                {
                    var result = Documents.SaveEdit(apConfig, fc["guid"], fc);

                    return Json(new { status = result });
                }
            }

            return Json(new { status = false });
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
            if (id.HasValue)
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (User.HasPermission(UserPermissionsEnum.EditProperties)) // The autocomplete is used only when editing properties
                {
                    var field = apConfig.Fields.FirstOrDefault(a => a.ID.ToString() == name);

                    var result = Documents.GetAutoComplete(apConfig, field, value);

                    if (result != null)
                    {
                        return Json(new { status = true, result = result });
                    }
                }
            }

            return Json(new { status = false });
        }

        public JsonResult GetAutoCompleteList(Guid? id, string source, string code)
        {
            try
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                using (var db = new DB().Get)
                {
                    string sqlstr = code == "getall" ? string.Format("select value, data from {DBSCHEMA}{0}".FormatDBSchema(apConfig.DBSchema), source) :
                        string.Format("select value, data from {DBSCHEMA}{0} where data=@code".FormatDBSchema(apConfig.DBSchema), source); // if code is empty, then return all

                    var query = db.Query(sqlstr, new { code = code });
                    var list = new List<AutoCompleteItem>();
                    foreach (var row in query)
                    {
                        list.Add(new AutoCompleteItem() { data = row.data, value = row.value });
                    }

                    return Json(new { ds = list }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                ex.Log();
                return Json(null, JsonRequestBehavior.AllowGet);
            }
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="id">Application ID</param>
        /// <param name="name"></param>
        /// <param name="value"></param>
        /// <returns></returns>
        public JsonResult AutoCompletePermission(Guid? id, string name, string value)
        {
            if (id.HasValue)
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (apConfig != null)
                {
                    var field = apConfig.Fields.FirstOrDefault(a => a.ID.ToString() == name);

                    if (field != null && field.EnableAutoComplete)
                    {
                        var result = Documents.GetAutoCompletePermission(apConfig, field, value);

                        if (result != null)
                        {
                            return Json(new
                            {
                                status = true,
                                result = result.Select(a => new UserDocument()
                                {
                                    IDApplication = apConfig.ID,
                                    IDField = field.ID,
                                    FieldText = a.FieldText,
                                    FieldValue = a.FieldValue
                                })
                            });
                        }
                    }
                    else if (field != null)
                    {
                        return Json(new { status = true, result = new List<UserDocument>() { new UserDocument() { IDField = field.ID, IDApplication = apConfig.ID, FieldText = value, FieldValue = value } }.ToArray() });
                    }
                }
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
        public AjaxResult GetNotes(Guid? id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] idd)
        {
            if (id.HasValue && idd != null && idd.Any() && User.HasPermission(UserPermissionsEnum.ViewNotes))
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

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
                            content += string.Format("{0}<br /><small style='color:#ccc;'>{1} {2} - {3} {4} {5:hh:mm:sstt}</small>", note.Text,
                                Words.Notes_WroteBy, note.Author,
                                note.Created.ToString(ConfigBase.Settings.DateFormat), Words.Notes_At, note.Created);

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

                        return new AjaxResult() { Data = content };
                    }
                }
            }

            return new AjaxResult(false);
        }

        /// <summary>
        /// Delete a note
        /// </summary>
        /// <param name="id">Application ID (Guid)</param>
        /// <param name="idNote">Note ID (Guid)</param>
        /// <returns></returns>
        public JsonResult DeleteNote(Guid? id, Guid? idNote)
        {
            if (id.HasValue && idNote.HasValue && User.HasPermission(UserPermissionsEnum.DeleteNotes))
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (apConfig != null)
                {
                    return Json(new { status = Note.Delete(apConfig, idNote.Value) });
                }
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
        public JsonResult SaveNote(Guid? id, [ModelBinder(typeof(GuidArrayModelBinder))] Guid[] docs, string text)
        {
            if (id.HasValue)
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                Guid doc = default(Guid);

                if (docs.Any())
                {
                    doc = docs.First();

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
            if (id.HasValue)
            {
                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, id.Value);

                if (User.HasPermission(UserPermissionsEnum.ViewDocuments) && User.HasPermission(UserPermissionsEnum.EmailDocument))
                {
                    AppCustomData appCustom = apConfig.Custom;

                    if (!string.IsNullOrWhiteSpace(appCustom?.EmailModule?.DomainsRestriction))
                    {
                        string[] domains = appCustom.EmailModule.DomainsRestriction.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                        string[] toEmails = fc["To"].Replace(",", ";").Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);

                        bool validEmails = true;

                        foreach (var email in toEmails)
                        {
                            bool found = false;

                            foreach (var domain in domains)
                            {
                                if (email.ToLowerInvariant().EndsWith(domain.Trim().ToLowerInvariant()))
                                {
                                    found = true;
                                    break;
                                }
                            }

                            if (!found)
                            {
                                validEmails = false;
                                break;
                            }
                        }

                        if (!validEmails)
                        {
                            return Json(new { status = false, ex = string.Format(Words.Email_InvalidDomain, appCustom.EmailModule.DomainsRestriction) });
                        }
                    }

                    Documents doc = new Documents()
                    {
                        AppID = id.Value,
                        List = docs
                    };
                    doc.LoadFiles();

                    if (!string.IsNullOrWhiteSpace(fc["PageFrom"]) && !string.IsNullOrWhiteSpace(fc["PageTo"]))
                    {
                        doc.StartPage = int.Parse(fc["PageFrom"]);
                        doc.TotalPages = int.Parse(fc["PageTo"]);
                    }
                    else
                    {
                        doc.StartPage = 0;
                        doc.TotalPages = 0;
                    }

                    if (doc.StartPage != 0 && doc.TotalPages != 0)
                    {
                        doc.TotalPages = doc.TotalPages - doc.StartPage + 1;
                    }

                    var result = Documents.Email(apConfig, fc, doc, User.Email, ControllerContext, User);

                    return Json(new { status = result });
                }
            }

            return Json(new { status = false });
        }

        #endregion

        #region Other

        [AuthorizeApplicationFilter]
        public JsonResult TotalRowsBadge(Library.Utils.Application app)
        {
            return Json(app.Settings.GetTotalRows(), JsonRequestBehavior.AllowGet);
        }

        #endregion

        #endregion

        [AllowAnonymous]
        public ActionResult ViewerLocal()
        {
            return View();
        }
    }
}