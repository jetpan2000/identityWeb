using Octacom.Odiss.Library;
using System.Collections.Generic;
using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class AuditIndex
    {
        public Audit Audit { get; set; }
        public IEnumerable<Audit> Audits { get; set; }
        public List<SelectListItem> ApplicationsFilter { get; set; }

        public int? Page { get; set; } = 0;
        public string Sort { get; set; }
        public string Exporting { get; set; }
    }
}