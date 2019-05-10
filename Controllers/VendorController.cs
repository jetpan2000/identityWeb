using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Octacom.Odiss.ABCgroup.Web.Code;
using Octacom.Odiss.ABCgroup.Web.Models;
using Octacom.Odiss.Core.Contracts.Settings;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    public class VendorController : Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.BaseController
    {
        private readonly ISettingsService settingsService;
        private readonly IApplicationService applicationService;

        public VendorController(ISettingsService settingsService, IApplicationService applicationService)
        {
            this.settingsService = settingsService;
            this.applicationService = applicationService;
        }

        // GET: Vendors
        public ActionResult Index(AppIndex model)
        {
            var appSettings = settingsService.Get();
            var app = applicationService.Get(model.ID.Value.ToString());

            var dataJson = JsonConvert.SerializeObject(app, new JsonSerializerSettings
            {
                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                StringEscapeHandling = StringEscapeHandling.EscapeHtml,
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
                Converters = new[] { new ApplicationJsonConverter() }
            });

            ViewBag.NoAngular = true;

            var gridModel = new DataGridModel
            {
                DataJson = dataJson,
                RowsPerPage = appSettings.MaxPerPage
            };

            return View(gridModel);
        }
    }
}