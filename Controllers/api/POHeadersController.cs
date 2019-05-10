using System.Web.Http;
using Octacom.Odiss.ABCgroup.Entities.AP;
using Octacom.Odiss.Core.Contracts.Repositories;
using Octacom.Odiss.Core.Contracts.Repositories.Searching;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    [RoutePrefix("api/POHeaders")]
    public class POHeadersController : ApiController
    {
        private readonly ISearchEngine<POHeader> poHeaderSearchEngine;
        private readonly ISearchEngine<POInvoiceItem> poInvoiceItemSearchEngine;
        private readonly ISearchEngine<PartNumber> partNumberSearchEngine;

        public POHeadersController(ISearchEngine<POHeader> poHeaderSearchEngine, ISearchEngine<POInvoiceItem> poInvoiceItemSearchEngine, ISearchEngine<PartNumber> partNumberSearchEngine)
        {
            this.poHeaderSearchEngine = poHeaderSearchEngine;
            this.poInvoiceItemSearchEngine = poInvoiceItemSearchEngine;
            this.partNumberSearchEngine = partNumberSearchEngine;
        }

        [HttpPost]
        [Route("Search")]
        public IHttpActionResult Search(SearchOptions searchOptions)
        {
            var data = poHeaderSearchEngine.Search(searchOptions);

            return Ok(data);
        }

        [HttpPost]
        [Route("SearchInvoiceItems")]
        public IHttpActionResult SearchInvoiceItems(SearchOptions searchOptions)
        {
            var data = poInvoiceItemSearchEngine.Search(searchOptions);

            return Ok(data);
        }

        [HttpPost]
        [Route("SearchPartNumbers")]
        public IHttpActionResult SearchPartNumbers(SearchOptions searchOptions)
        {
            var data = partNumberSearchEngine.Search(searchOptions);

            return Ok(data);
        }
    }
}
