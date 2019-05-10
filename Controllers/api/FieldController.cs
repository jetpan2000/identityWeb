using System;
using System.Web.Http;
using Octacom.Odiss.Core.Contracts.Services;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    [RoutePrefix("api/field")]
    public class FieldController : ApiController
    {
        private readonly IApplicationGridService applicationGridService;

        public FieldController(IApplicationGridService applicationGridService)
        {
            this.applicationGridService = applicationGridService;
        }

        [HttpGet]
        [Route("{fieldId}/FilterValues")]
        public IHttpActionResult GetFilterValues(Guid fieldId, string parameter = null)
        {
            var data = applicationGridService.ResolveFieldFilter(fieldId, parameter);

            return Ok(data);
        }
    }
}
