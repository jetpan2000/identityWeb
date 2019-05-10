using Octacom.Odiss.ABCgroup.Web.Globalization;
using System.ComponentModel.DataAnnotations;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class LoginIndex
    {
        [Required(ErrorMessageResourceName = "Login_EmptyUsername", ErrorMessageResourceType = typeof(Words))]
        public string Username { get; set; }

        [DataType(DataType.Password)]
        [Required(ErrorMessageResourceName = "Login_EmptyPassword", ErrorMessageResourceType = typeof(Words))]
        //[MinLength(6, ErrorMessageResourceName = "", ErrorMessageResourceType = typeof(Words))]
        public string Password { get; set; }
    }
}