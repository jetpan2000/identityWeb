using Octacom.Odiss.Library;
using System.Collections.Generic;
using System.Web.Mvc;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class UserIndex : ModelBase
    {
        public Users User { get; set; }
        public IEnumerable<Users> Users { get; set; }
        public IEnumerable<SelectListItem> UserTypes => Library.Users.GetUserTypes();

        public string ExtraData { get; set; }
        public int? Page { get; set; } = 0;
        public string Sort { get; set; }
    }
}