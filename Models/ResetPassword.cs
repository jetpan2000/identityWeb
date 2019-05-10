using Octacom.Odiss.ABCgroup.Web.Globalization;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class ResetPassword
    {
        [DataType(DataType.EmailAddress)]
        [Required(ErrorMessageResourceName = "Login_EmptyEmail", ErrorMessageResourceType = typeof(Words))]
        public string EmailAddress { get; set; }
    }
}