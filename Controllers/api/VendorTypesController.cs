using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.Entities.Vendors;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class VendorTypesController : LookupTypeController<VendorType>
    {
        public VendorTypesController(ILookupTypeRepository<VendorType> lookupTypeRepository) : base(lookupTypeRepository)
        {
        }
    }
}
