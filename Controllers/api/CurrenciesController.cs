using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.Entities.Common;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class CurrenciesController : LookupTypeController<CurrencyCode>
    {
        public CurrenciesController(ILookupTypeRepository<CurrencyCode> lookupTypeRepository) : base(lookupTypeRepository)
        {
        }
    }
}
