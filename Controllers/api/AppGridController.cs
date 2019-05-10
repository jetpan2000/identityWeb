using Octacom.Odiss.Core.Contracts.Repositories;
using Octacom.Odiss.Core.Contracts.Repositories.Searching;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    [RoutePrefix("api/app-grid/{appId}")]
    //[Authorize]
    public class AppGridController : ApiController
    {
        private readonly IApplicationGridRepository applicationGridRepository;

        public AppGridController(IApplicationGridRepository applicationGridRepository)
        {
            this.applicationGridRepository = applicationGridRepository;
        }

        [Route("")]
        [HttpGet]
        public IHttpActionResult Get(Guid appId)
        {
            var result = this.applicationGridRepository.GetAll(appId);

            return Ok(result);
        }

        [Route("")]
        [HttpPost]
        public IHttpActionResult Create(Guid appId, [FromBody] Dictionary<Guid, object> item)
        {
            var createdItem = this.applicationGridRepository.Insert(appId, item);

            return Ok(createdItem);
        }

        [Route("")]
        [HttpPut]
        public IHttpActionResult Update(Guid appId, [FromBody] Dictionary<Guid, object> item)
        {
            this.applicationGridRepository.Update(appId, item);

            return Ok();
        }

        [Route("")]
        [HttpDelete]
        public IHttpActionResult Delete(Guid appId, [FromUri] object key)
        {
            this.applicationGridRepository.Delete(appId, key);

            return Ok();
        }

        [Route("Search")]
        [HttpPost]
        public IHttpActionResult Search(Guid appId, SearchOptions searchOptions)
        {
            var data = this.applicationGridRepository.Search(appId, searchOptions);
            
            return Ok(data);
        }
    }
}