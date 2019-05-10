using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.Entities.Invoice;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class ExceptionCodesController : LookupTypeController<ExceptionCode>
    {
        public ExceptionCodesController(ILookupTypeRepository<ExceptionCode> lookupTypeRepository) : base(lookupTypeRepository)
        {
        }
    }
}