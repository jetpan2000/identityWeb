using System;
using System.Web.Http;
using Octacom.Odiss.ABCgroup.Business.Services;
using Octacom.Odiss.ABCgroup.Entities.Settings;
using Octacom.Odiss.Core.Entities.User;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    [RoutePrefix("api/users")]
    public class UsersController : ApiController
    {
        private readonly IABCUserService userService;

        public UsersController(IABCUserService userService)
        {
            this.userService = userService;
        }

        [Route("hasPermission/{permission}")]
        [Authorize]
        [HttpGet]
        public IHttpActionResult HasPermission(AppUserPermission permission)
        {
            var result = userService.HasPermission(permission);

            return Ok(result);
        }

        [Route("canEditDocument/{id}")]
        [Authorize]
        [HttpGet]
        public IHttpActionResult CanEditDocument(Guid id)
        {
            var result = userService.UserCanEditDocument(id);

            return Ok(result);
        }
    }
}
