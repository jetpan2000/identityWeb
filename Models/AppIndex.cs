using System;
using System.Web;
using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class AppIndex
    {
        public Guid? ID { get; set; }
        public string Exporting { get; set; }
        public int? Page { get; set; }
        public string Sort { get; set; }
        public FormCollection Form => new FormCollection(HttpContext.Current.Request.Form);

        public AppIndex()
        {
            Page = 0;
        }
    }
}