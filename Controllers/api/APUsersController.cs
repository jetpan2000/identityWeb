using System;
using System.Web.Http;
using Octacom.Odiss.ABCgroup.Entities.AP;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.AP;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    [RoutePrefix("api/ap/users")]
    public class APUsersController : ApiController
    {
        private readonly IAPUserRepository apUserRepository;

        public APUsersController(IAPUserRepository apUserRepository)
        {
            this.apUserRepository = apUserRepository;
        }

        [HttpGet]
        [Route("{userId}")]
        public IHttpActionResult Get(Guid userId)
        {
            var user = apUserRepository.GetDto(userId);

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Save(APUserDto apUser)
        {
            apUserRepository.Save(apUser);

            return Ok();
        }
    }
}
