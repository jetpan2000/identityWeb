using System;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using Octacom.Odiss.ABCgroup.Web.Models;
using Octacom.Odiss.Core.Identity.Entities;
using Octacom.Odiss.Core.Identity.Managers;
using Octacom.Odiss.Core.Identity.Validators;
using Octacom.Odiss.Library.Config;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    public class AuthController : Controller
    {
        private readonly SignInManager<OdissUser, Guid> signInManager;
        private readonly OdissUserManager userManager;
        private readonly IAuthenticationManager authenticationManager;

        // NOTES
        // * This controller will not follow the general RESTful API guidelines for the following reasons
        //   1) We must not communicate results with the client unless it's necessary. It's a security breach when network traffic shows details of authentications.
        //   2) All REST communication goes in POST as it keeps all information out of the public domain (assuming that the sites are using SSL)
        //   3) We are unable to use WebApi because the login action needs to use ValidateAntiForgeryToken which is only available for traditional Controller
        //      a) Another benefit we get then is this controller implementation can be packaged in just one class. Makes it easier for deployment to existing Odiss 5 sites.
        public AuthController(SignInManager<OdissUser, Guid> signInManager, OdissUserManager userManager, IAuthenticationManager authenticationManager)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            this.authenticationManager = authenticationManager;
        }

        [HttpGet]
        [Route("login")]
        public ActionResult Login()
        {
            var loginModel = new LoginViewModel
            {
                Name = ConfigBase.Settings.Name,
                Logo = ConfigBase.Settings.Logo,
                PasswordReset = ConfigBase.Settings.PasswordReset,
                UsernameReminder = ConfigBase.Settings.UsernameReminder,
                DefaultRedirectUrl = Url.Action("Index", "Home"),
                PasswordValidator = (OdissPasswordValidator)userManager.PasswordValidator
            };

            return View(loginModel);
        }

        [HttpPost]
        [Route("login")]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Login(LoginModel model)
        {
            var result = await signInManager.PasswordSignInAsync(model.Username, model.Password, model.RememberMe, shouldLockout: true);

            return Json(result.ToString());
        }

        [HttpGet]
        [Route("logoff")]
        public Task<ActionResult> Logoff()
        {
            authenticationManager.SignOut();

            ActionResult result = RedirectToAction("Index", "Home");

            return Task.FromResult(result);
        }

        [HttpPost]
        [Route("forgot-password")]
        public async Task<ActionResult> ForgotPassword(string email)
        {
            var callbackUrl = Url.Action("Login", "Auth", null, Request.Url.Scheme) + "#/reset-password/{token}";
            await userManager.SendForgotPasswordEmailAsync(email, callbackUrl);

            return Json("Success");
        }

        [HttpPost]
        [Route("username-reminder")]
        public async Task<ActionResult> UsernameReminder(string email)
        {
            await userManager.SendForgotUsernameEmailAsync(email);

            return Json("Success");
        }

        [HttpPost]
        [Route("reset-password")]
        public async Task<ActionResult> ResetPassword(string passwordResetKey, string newPassword)
        {
            var identityResult = await userManager.ResetPasswordAsync(passwordResetKey, newPassword);

            if (!identityResult.Succeeded)
            {
                if (identityResult.Errors.Any(error => error.Contains("Password reset key is expired")))
                {
                    return Json("Expired");
                }

                throw new Exception($"Could not reset password for key {passwordResetKey}. Reasons - {string.Join(", ", identityResult.Errors)}");
            }

            return Json("Success");
        }
    }
}