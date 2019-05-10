using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.Entities.Common;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class CountriesController : LookupTypeController<Country>
    {
        public CountriesController(ILookupTypeRepository<Country> lookupTypeRepository) : base(lookupTypeRepository)
        {
        }
    }
}
