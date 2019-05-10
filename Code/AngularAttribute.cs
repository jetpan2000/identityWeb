using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class AngularAttribute : FilterAttribute, IResultFilter
    {
        private string App { get; set; }
        private AngularControllerEnum Controller { get; set; }
        private string InstanceName { get; set; }

        public AngularAttribute(AngularControllerEnum controller)
        {
            App = "odissApp";
            Controller = controller;
        }

        public AngularAttribute(AngularControllerEnum controller, string instanceName)
        {
            App = "odissApp";
            Controller = controller;
            InstanceName = instanceName;
        }

        public void OnResultExecuted(ResultExecutedContext filterContext)
        {
        }

        public void OnResultExecuting(ResultExecutingContext filterContext)
        {
            if (!string.IsNullOrWhiteSpace(App))
                filterContext.Controller.ViewBag.AngularApp = App;

            filterContext.Controller.ViewBag.AngularController =
                !string.IsNullOrWhiteSpace(InstanceName) ?
                $"{Controller} as {InstanceName}" :
                Controller.ToString();
        }
    }
}