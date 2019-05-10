using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using Newtonsoft.Json;
using Octacom.Odiss.ABCgroup.Business.CommandPattern;
using Octacom.Odiss.ABCgroup.Business.Services;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.Invoice;
using Octacom.Odiss.ABCgroup.Entities.Invoice;
using Octacom.Odiss.Core.Contracts.Services;

namespace Octacom.Odiss.ABCgroup.Web.Controllers.api
{
    [RoutePrefix("api/Documents")]
    public class DocumentsController : ApiController
    {
        private readonly IDocumentInvoiceRepository documentInvoiceRepository;
        private readonly IInvoiceService invoiceService;
        private readonly IDocumentService<DocumentInvoice> documentService;
        private readonly IDocumentActionService actionService;

        public DocumentsController(IDocumentInvoiceRepository documentInvoiceRepository, IInvoiceService invoiceService, IDocumentService<DocumentInvoice> documentService, IDocumentActionService actionService)
        {
            this.documentInvoiceRepository = documentInvoiceRepository;
            this.invoiceService = invoiceService;
            this.documentService = documentService;
            this.actionService = actionService;
        }

        [Route("{id}")]
        public IHttpActionResult Get(Guid id)
        {
            var item = documentInvoiceRepository.Get(id);

            return Ok(item);
        }

        [Route("")]
        public IHttpActionResult Put(DocumentInvoice document)
        {
            var result = actionService.Save(document);

            return CommandResult(result);
        }

        [Route("{id}/AvailableActions")]
        [HttpGet]
        public IHttpActionResult GetAvailableActions(Guid id)
        {
            var availableActions = actionService.GetActions(id);

            return Ok(availableActions);
        }

        [Route("{id}/SetToPendingApproval")]
        [HttpPost]
        public IHttpActionResult SetToPendingApproval(Guid id)
        {
            var result = actionService.SetToPendingApproval(id);

            return CommandResult(result);
        }

        [Route("{id}/Approve")]
        [HttpPost]
        public IHttpActionResult Approve(Guid id)
        {
            var result = actionService.Approve(id);

            return CommandResult(result);
        }

        [Route("{id}/SubmitForApproval")]
        [HttpPost]
        public IHttpActionResult SubmitForApproval(Guid id)
        {
            var result = actionService.SubmitForApproval(id);

            return CommandResult(result);
        }

        [Route("{id}/Reject")]
        [HttpPost]
        public IHttpActionResult Reject(Guid id)
        {
            var result = actionService.Reject(id);

            return CommandResult(result);
        }

        [Route("{id}/Archive")]
        [HttpPost]
        public IHttpActionResult Archive(Guid id)
        {
            var result = actionService.Archive(id);

            return CommandResult(result);
        }

        [Route("{id}/SetToOnHold")]
        [HttpPost]
        public IHttpActionResult SetToOnHold(Guid id)
        {
            var result = actionService.SetToOnHold(id);

            return CommandResult(result);
        }

        [Route("{id}/RevertRejection")]
        [HttpPost]
        public IHttpActionResult RevertRejection(Guid id)
        {
            var result = actionService.RevertRejection(id);

            return CommandResult(result);
        }

        [Route("{id}/History")]
        [HttpGet]
        public IHttpActionResult GetDocumentHistory(Guid id)
        {
            var result = documentInvoiceRepository.GetDocumentHistory(id);

            return Ok(result);
        }

        [Route("{id}/ForwardToOtherPlant/{plantId}")]
        public IHttpActionResult ForwardToOtherPlant(Guid id, Guid plantId)
        {
            var result = actionService.ForwardToOtherPlant(id, plantId);

            return CommandResult(result);
        }

        [Route("{id}/Resubmit")]
        [HttpPost]
        public IHttpActionResult Resubmit(Guid id)
        {
            var result = actionService.Resubmit(id);

            return CommandResult(result);
        }

        [Route("Submit")]
        [HttpPost]
        public async Task<IHttpActionResult> Submit()
        {
            var fileReadProvider = await Request.Content.ReadAsMultipartAsync();
            var fileReadContent = fileReadProvider.Contents[0];
            string filename = fileReadContent.Headers.ContentDisposition.FileName.Replace("\"", "");
            var documentData = HttpContext.Current.Request.Params["documentData"];
            var document = JsonConvert.DeserializeObject<DocumentInvoice>(documentData);
            document.InvoiceStatusCode = "PendingApproval";

            var fileBytes = await fileReadContent.ReadAsByteArrayAsync();

            documentService.SubmitDocument(document, fileBytes, filename);

            return Ok();
        }

        [Route("{id}/uploadSupportingDocument")]
        [HttpPost]
        public async Task<IHttpActionResult> UploadSupportingDocument(Guid id)
        {
            var fileReadProvider = await Request.Content.ReadAsMultipartAsync();
            var fileReadContent = fileReadProvider.Contents[0];
            string filename = fileReadContent.Headers.ContentDisposition.FileName.Replace("\"", "");
            var description = HttpContext.Current.Request.Params["description"];

            var fileBytes = await fileReadContent.ReadAsByteArrayAsync();

            invoiceService.UploadSupportingDocument(id, description, fileBytes, filename);

            return Ok();
        }

        [Route("DocumentStatusSummary")]
        [HttpGet]
        public IHttpActionResult GetDocumentStatusSummary()
        {
            var result = documentInvoiceRepository.GetDocumentStatusSummary();

            return Ok(result);
        }

        [Route("ExceptionCount")]
        [HttpGet]
        public IHttpActionResult GetExceptionCount()
        {
            var result = documentInvoiceRepository.GetNumberOfExceptions();

            return Ok(result);
        }

        private IHttpActionResult CommandResult(CommandResult commandResult)
        {
            if (commandResult.IsSuccess)
            {
                return Ok();
            }
            else
            {
                return ResponseMessage(
                    new System.Net.Http.HttpResponseMessage(
                        System.Net.HttpStatusCode.InternalServerError
                    )
                    {
                        Content = new StringContent(string.Join("\\n", commandResult.Errors))
                    });
            }
        }

        private IHttpActionResult MvcServiceResult(ServiceResult serviceResult)
        {
            if (serviceResult.IsSuccess)
            {
                return Ok();
            }
            else
            {
                return ResponseMessage(
                    new System.Net.Http.HttpResponseMessage(
                        System.Net.HttpStatusCode.InternalServerError
                    )
                    {
                        Content = new StringContent(serviceResult.Message)
                    });
            }
        }
    }
}