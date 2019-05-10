using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web
{
    /// <inheritdoc>
    ///     <cref />
    /// </inheritdoc>
    /// <summary>
    /// Attribute used to define active interface menu
    /// </summary>
    public class MenuAttribute : FilterAttribute, IResultFilter
    {
        private MenuEnum Menu { get; set; }

        public MenuAttribute(MenuEnum menu)
        {
            Menu = menu;
        }

        public void OnResultExecuted(ResultExecutedContext filterContext)
        {
        }

        public void OnResultExecuting(ResultExecutingContext filterContext)
        {
            filterContext.Controller.ViewBag.ActiveMenu = Menu;
        }
    }
}