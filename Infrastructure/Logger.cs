//using Octacom.Odiss.Core.Contracts.Infrastructure;
//using Octacom.Odiss.Core.Contracts.Services;
//using Octacom.Odiss.Library;
//using Octacom.Odiss.ABCgroup.Web.Code;
//using System;
//using System.Web;
//using Serilog;
//using IOdissLogger = Octacom.Odiss.Core.Contracts.Infrastructure.ILogger;
//using ISerilogLogger = Serilog.ILogger;

//namespace Octacom.Odiss.ABCgroup.Web.Infrastructure
//{
//    public class Logger : IOdissLogger
//    {
//        private readonly IPrincipalService principalService;
//        private readonly ISerilogLogger serilogLogger;
        

//        public Logger(IPrincipalService principalService)
//        {
//            this.principalService = principalService;
//            this.serilogLogger = new LoggerConfiguration()
//                .ReadFrom.AppSettings()
//                .CreateLogger();
//        }

//        public void LogActivity(string activityType, object data)
//        {
//            AuditTypeEnum? auditType = 0;
//            var principal = principalService.GetCurrentPrincipal();

//            var appId = HttpContext.Current.Request.UrlReferrer.GetApplicationIdFromUri();

//            var audit = new Audit
//            {
//                IDApplication = appId,
//                Action = auditType,
//                UserName = principal?.Identity?.Name,
//                Recorded = DateTime.Now,
//                Data = data
//            };

//            Audit.Save(audit);
//        }

//        public void LogException(Exception exception, ExceptionSeverity severity)
//        {
//            switch (severity)
//            {
//                case ExceptionSeverity.Severe:
//                    serilogLogger.Fatal(exception, string.Empty);
//                    break;
//                default:
//                    serilogLogger.Error(exception, string.Empty);
//                    break;
//            }
//        }

//        public void LogSystemActivity(string activityType, object data)
//        {
//            serilogLogger.Information(activityType + " - {@data}", data);
//            serilogLogger.Verbose(activityType + " - {@data} - {@StackTrace}", data, Environment.StackTrace);
//        }
//    }
//}