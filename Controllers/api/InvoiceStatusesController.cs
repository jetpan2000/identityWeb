using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.Entities.Invoice;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class InvoiceStatusesController : LookupTypeController<InvoiceStatus>
    {
        public InvoiceStatusesController(ILookupTypeRepository<InvoiceStatus> lookupTypeRepository) : base(lookupTypeRepository)
        {
        }
    }
}