using System.Web;
using Octacom.Odiss.Core.Contracts.Services;

namespace Octacom.Odiss.ABCgroup.Web.Code
{
    public class ABCApplicationService : IApplicationService
    {
        public string GetBaseUrl()
        {
            var request = HttpContext.Current.Request;
            var baseUrl = string.Format("{0}://{1}{2}", request.Url.Scheme, request.Url.Authority, (new System.Web.Mvc.UrlHelper(request.RequestContext)).Content("~"));
            return baseUrl;
        }
    }
}