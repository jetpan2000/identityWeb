using System.Net;
using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    public class ErrorController : Controller
    {
        public ActionResult NotFound()
        {
            Response.StatusCode = (int)HttpStatusCode.NotFound;
            return View();
        }

        public ActionResult Forbidden()
        {
            Response.StatusCode = (int)HttpStatusCode.Forbidden;
            return View();
        }

        public ActionResult CustomError()
        {
            Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            return View();
        }
    }
}