using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Config;
using Octacom.Odiss.Library.Models;
using Octacom.Odiss.ABCgroup.Web.Globalization;
using System;
using System.Collections.Generic;
using System.Web.Mvc;
using System.Linq;
using System.Web;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    [Authorize]
    public class AuditController : Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.BaseController
    {
        /// <summary>
        /// Show the Audit page
        /// </summary>
        /// <param name="ai"></param>
        /// <returns></returns>
        [Menu(MenuEnum.Audit)]
        public ActionResult Index(AuditIndex ai)
        {
            if (!User.HasPermission(UserPermissionsEnum.ViewAudits))
            {
                return new HttpUnauthorizedResult();
            }

            ai.ApplicationsFilter = new List<SelectListItem> {
                new SelectListItem { Value = null, Text = Words.Audit_AnyWhere },
                new SelectListItem { Value = new Guid("00000000-0000-0000-0000-000000000001").ToString(), Text = Words.Audit_System },
                new SelectListItem { Value = new Guid("00000000-0000-0000-0000-000000000002").ToString(), Text = Words.Audit_AllApplications }
            };
            ai.ApplicationsFilter.AddRange(ConfigBase.Settings.Applications.FilterForLoggedUser(User).Select(a => new SelectListItem()
            {
                Value = a.ID.ToString(),
                Text = @" -- " + a.Name.ToLanguage()
            }));

            if (ai.Audit == null) return View(ai);

            string actions = Audit.ParseActions(ai.Audit.Actions);

            if (!ai.Page.HasValue)
            {
                ai.Page = 1;
            }

            if (!string.IsNullOrWhiteSpace(ai.Exporting) && ai.Exporting == "1")
            {
                if (UserPermissionsEnum.ExportResults.IsUserAuthorized(User))
                {
                    HttpContext.Response.SetCookie(new HttpCookie("fileDownload", "true") { Path = "/" });

                    Audit.ExportAjax(app: ai.Audit.IDApplication, userName: ai.Audit.UserName, recordedRange: ai.Audit.RecordedRange, actions: actions, sortBy: ai.Sort, page: ai.Page.Value);
                }

                return null;
            }
            else
            {
                return Json(Audit.Search(app: ai.Audit.IDApplication, userName: ai.Audit.UserName, recordedRange: ai.Audit.RecordedRange, actions: actions, sortBy: ai.Sort, page: ai.Page.Value));
            }
        }

        #region Ajax Requests

        public JsonResult GetData(Guid id)
        {
            var dataReference = Audit.GetData(id);

            return Json(new { Data = dataReference.Data, Reference = dataReference.Reference });
        }

        /// <summary>
        /// Get chart statistics
        /// </summary>
        /// <param name="type">Type of chart (1 = Week Activities, 2 = By Action Type)</param>
        /// <returns></returns>
        public JsonResult GetStatistics(int type)
        {
            return !User.HasPermission(UserPermissionsEnum.ViewAudits) ?
                Json(new { status = false }) :
                Json(new { Data = Audit.GetStatistics(type) });
        }

        /// <summary>
        /// Get statistics for calendar
        /// </summary>
        /// <param name="start">Start Date</param>
        /// <param name="end">End Date</param>
        /// <returns></returns>
        public JsonResult Get(DateTime start, DateTime end)
        {
            if (!User.HasPermission(UserPermissionsEnum.ViewAudits)) return Json(new { status = false });

            List<AuditCalendar> items = Audit.GetForCalendar(start, end);
            /*
                items.AddRange(items.GroupBy(a => a.Created.ToShortDateString()).Select(a => new AuditCalendar() {
                    Created = a.First().Created,
                    color = "#ffffff",
                    rendering = "background"
                }));
                */

            return Json(items);
        }

        #endregion
    }
}