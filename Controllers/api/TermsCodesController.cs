using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.Entities.Vendors;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class TermsCodesController : LookupTypeController<TermsCode>
    {
        public TermsCodesController(ILookupTypeRepository<TermsCode> lookupTypeRepository) : base(lookupTypeRepository)
        {
        }
    }
}
