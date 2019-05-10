using System.Web.Http;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.AP;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    [RoutePrefix("api/AP/Roles")]
    public class APRolesController : ApiController
    {
        private readonly IAPRoleRepository apRoleRepository;

        public APRolesController(IAPRoleRepository apRoleRepository)
        {
            this.apRoleRepository = apRoleRepository;
        }

        [Route("")]
        public IHttpActionResult Get()
        {
            var data = this.apRoleRepository.GetAll();

            return Ok(data);
        }
    }
}
