using System.Security.Principal;
using System.Web;
using Octacom.Odiss.Core.Contracts.Services;

namespace Octacom.Odiss.ABCgroup.Web.Code
{
    public class ABCPrincipalService : IPrincipalService
    {
        public IPrincipal GetCurrentPrincipal()
        {
            return HttpContext.Current.User;
        }

        public string GetIpAddress()
        {
            return HttpContext.Current.Request.UserHostAddress;
        }
    }
}