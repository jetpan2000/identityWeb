using Newtonsoft.Json;
using Octacom.Odiss.ABCgroup.Web.Code;
using Octacom.Odiss.Core.Identity.Validators;

namespace Octacom.Odiss.ABCgroup.Web.Models
{
    public class LoginViewModel
    {
        public string Name { get; set; }
        public string Logo { get; set; }
        public bool PasswordReset { get; set; }
        public bool UsernameReminder { get; set; }
        public string DefaultRedirectUrl { get; set; }

        public OdissPasswordValidator PasswordValidator { get; set; }

        [JsonIgnore]
        public string AsJson => this.ToJson();
    }
}