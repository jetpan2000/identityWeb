using Octacom.Odiss.ABCgroup.Web.Globalization;
using System.ComponentModel.DataAnnotations;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class UsernameReminder
    {
        [DataType(DataType.EmailAddress)]
        [Required(ErrorMessageResourceName = "Login_EmptyEmail", ErrorMessageResourceType = typeof(Words))]
        public string EmailAddressUsernameReminder { get; set; }
    }
}