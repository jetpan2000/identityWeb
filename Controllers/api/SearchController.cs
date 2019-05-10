using System.Web.Http;
using Octacom.Odiss.Core.Contracts.DataLayer.Search;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    public class SearchController : ApiController
    {
        private readonly GlobalSearchEngine searchEngine;

        public SearchController(GlobalSearchEngine searchEngine)
        {
            this.searchEngine = searchEngine;
        }

        [Route("api/Search")]
        [HttpPost]
        public IHttpActionResult Search(GlobalSearchOptions options)
        {
            var result = searchEngine.Search(options);

            return Ok(result);
        }
    }
}
