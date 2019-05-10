using System;
using System.Collections.Generic;
using System.Web.Http;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.Vendors;
using Octacom.Odiss.ABCgroup.Entities.Vendors;
using Octacom.Odiss.ABCgroup.Web.Code;
using Octacom.Odiss.Core.Contracts.DataLayer.Search;
using Octacom.Odiss.Core.Contracts.Services;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class VendorsController : ApiController
    {
        private readonly IVendorRepository vendorRepository;
        private readonly IApplicationGridService applicationGridService;
        private readonly VendorGridSearchEngine searchEngine;

        public VendorsController(IVendorRepository vendorRepository, IApplicationGridService applicationGridService, VendorGridSearchEngine searchEngine)
        {
            this.vendorRepository = vendorRepository;
            this.applicationGridService = applicationGridService;
            this.searchEngine = searchEngine;
        }

        // GET: api/Vendors/5
        public IHttpActionResult Get(Guid id)
        {
            var data = vendorRepository.Get(id);

            return Ok(data);
        }

        [HttpPost]
        [Route("api/Vendors/Search")]
        public IHttpActionResult Search(SearchOptions searchOptions)
        {
            var data = searchEngine.Search(searchOptions);

            return Ok(data);
        }

        // POST: api/Vendors
        public IHttpActionResult Post([FromBody]Dictionary<Guid, object> data)
        {
            var appId = Request.GetApplicationIdFromReferrer();

            if (appId == null)
            {
                return InternalServerError();
            }

            var vendor = applicationGridService.MapDataToEntity<Vendor>(appId.Value, data);
            vendorRepository.Create(vendor);

            return Ok(data);
        }

        // PUT: api/Vendors
        public IHttpActionResult Put([FromBody]Dictionary<Guid, object> data)
        {
            var appId = Request.GetApplicationIdFromReferrer();

            if (appId == null)
            {
                return InternalServerError();
            }

            var vendor = applicationGridService.MapDataToEntity<Vendor>(appId.Value, data);

            vendorRepository.Update(vendor, vendor.Id);

            return Ok(data);
        }
    }
}
