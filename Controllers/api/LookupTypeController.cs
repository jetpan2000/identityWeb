using System.Web.Http;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.Entities;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public abstract class LookupTypeController<TLookupEntity> : ApiController
        where TLookupEntity : class, IOrderable
    {
        private readonly ILookupTypeRepository<TLookupEntity> lookupTypeRepository;

        public LookupTypeController(ILookupTypeRepository<TLookupEntity> lookupTypeRepository)
        {
            this.lookupTypeRepository = lookupTypeRepository;
        }

        public IHttpActionResult Get()
        {
            var data = lookupTypeRepository.GetAll();

            return Ok(data);
        }
    }
}
