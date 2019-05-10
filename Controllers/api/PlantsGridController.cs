using Octacom.Odiss.ABCgroup.DataLayer.Repositories.Plants;
using Octacom.Odiss.ABCgroup.Entities.Plants;
using Octacom.Odiss.ABCgroup.Web.Code;
using Octacom.Odiss.ABCgroup.Web.Models;
using Octacom.Odiss.Core.Contracts.Services;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class PlantsGridController : ApiController
    {
        private readonly IPlantRepository plantRepository;
        private readonly IApplicationGridService applicationGridService;
        private readonly PlantSearchEngine searchEngine;

        public PlantsGridController(IPlantRepository plantRepository, IApplicationGridService applicationGridService, PlantSearchEngine searchEngine)
        {
            this.plantRepository = plantRepository;
            this.applicationGridService = applicationGridService;
            this.searchEngine = searchEngine;
        }

        // GET: api/Plants/5
        public IHttpActionResult Get(Guid id)
        {
            var data = plantRepository.Get(id);

            return Ok(data);
        }

        [HttpPost]
        [Route("api/PlantsGrid/Search")]
        public IHttpActionResult Search(EnhancedSearchOptions searchOptions)
        {
            if (searchOptions.AllowNoPlantRestrictions)
            {
                searchEngine.AllowNoPlantRestrictions();
            }

            var data = searchEngine.Search(searchOptions);

            return Ok(data);
        }

        // POST: api/Plants
        public IHttpActionResult Post([FromBody]Dictionary<Guid, object> data)
        {
            var appId = Request.GetApplicationIdFromReferrer();

            if (appId == null)
            {
                return InternalServerError();
            }

            var plant = applicationGridService.MapDataToEntity<Plant>(appId.Value, data);
            plantRepository.Create(plant);

            return Ok(data);
        }

        // PUT: api/Plants
        public IHttpActionResult Put([FromBody]Dictionary<Guid, object> data)
        {
            var appId = Request.GetApplicationIdFromReferrer();

            if (appId == null)
            {
                return InternalServerError();
            }

            var plant = applicationGridService.MapDataToEntity<Plant>(appId.Value, data);

            plantRepository.Update(plant, plant.Id);

            return Ok(data);
        }

        // DELETE: api/Plants/5
        public IHttpActionResult Delete(Guid id)
        {
            plantRepository.Delete(id);

            return Ok();
        }

        [Route("api/plantsGrid/{plantId}/GLAccountNumbers")]
        public IHttpActionResult GetGlAccountNumbers(Guid plantId)
        {
            var data = plantRepository.GetGLAccountNumbers(plantId);

            return Ok(data);
        }

        [Route("api/plantsGrid/{plantId}/ValidateGlAccountNumber/{accountNumber}")]
        [HttpGet]
        public IHttpActionResult ValidateGlAccountNumber(string accountNumber, Guid plantId)
        {
            return Ok(plantRepository.ValidateGlAccountNumber(accountNumber, plantId));
        }
    }
}
