using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.Entities.Invoice;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class InvoiceSubmissionStatusesController : LookupTypeController<InvoiceSubmissionStatus>
    {
        public InvoiceSubmissionStatusesController(ILookupTypeRepository<InvoiceSubmissionStatus> lookupTypeRepository) : base(lookupTypeRepository)
        {
        }
    }
}