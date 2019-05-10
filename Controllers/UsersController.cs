using Newtonsoft.Json;
using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Config;
using Octacom.Odiss.ABCgroup.Web.Globalization;
using System;
using System.Linq;
using System.Web.Mvc;
using StackExchange.Exceptional;
using Octacom.Odiss.Core.Contracts.Repositories;
using Octacom.Odiss.ABCgroup.Web.Adapters;
using Octacom.Odiss.ABCgroup.Entities.Settings;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    /// <summary>
    /// Users controller.
    /// </summary>
    [Authorize]
    public class UsersController : Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.BaseController
    {
        private const string AdminRoles = "Administrator,Super,Octacom";
        private readonly IUserRepository userRepository;

        public UsersController(IUserRepository userRepository)
        {
            this.userRepository = userRepository;
        }

        /// <summary>
        /// Users page
        /// </summary>
        /// <param name="ui">Search/filter data</param>
        /// <returns></returns>
        [Angular(AngularControllerEnum.UsersController, "users")]
        [Menu(MenuEnum.Users)]
        [Authorize(Roles = AdminRoles)]
        public ActionResult Index(UserIndex ui)
        {
            if (ui.User != null)
            {
                if (!ui.Page.HasValue)
                {
                    ui.Page = 1;
                }

                return Json(Users.SearchAjax(active: ui.User.Active, userType: ui.User.Type, userName: ui.User.UserName, firstName: ui.User.FirstName, lastName: ui.User.LastName, sortBy: ui.Sort, page: ui.Page.Value));
            }

            try
            {
                object extraData = GetTypes().Data;

                if (extraData != null)
                {
                    ui.ExtraData = JsonConvert.SerializeObject(extraData);
                }
            }
            catch (Exception ex)
            {
                ex.Log();
            }

            return View(ui);
        }

        [Menu(MenuEnum.UserSettings)]
        public ActionResult Settings()
        {
            return View();// RedirectToAction("ChangePassword");
        }

        [Menu(MenuEnum.UserSettings)]
        public ActionResult ChangePassword()
        {
            return View();
        }

        [Menu(MenuEnum.UserSettings)]
        public ActionResult ChangeLanguage()
        {
            return View();
        }

        #region Ajax Requests

        /// <summary>
        /// Get user data
        /// </summary>
        /// <param name="id">User ID (Guid)</param>
        /// <returns></returns>
        [Authorize(Roles = AdminRoles)]
        public JsonResult Get(Guid id)
        {
            return Json(new { User = Users.Get(id) });
        }

        /// <summary>
        /// Edit or add a new user
        /// </summary>
        /// <param name="user">User data</param>
        /// <returns></returns>
        [Authorize(Roles = AdminRoles)]
        public JsonResult Save(Users user)
        {
            try
            {
                if (user.Applications != null)
                {
                    foreach (Guid appID in user.Applications)
                    {
                        App app = new App
                        {
                            ID = appID
                        };

                        var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, app.ID);

                        if (apConfig.Custom?.RestrictFieldForTempUser != null && user.Type == 1)
                        {
                            bool restricted = false;
                            if (user.Documents != null)
                            {
                                foreach (UserDocument userDocument in user.Documents)
                                {
                                    if (userDocument.IDField == apConfig.Custom.RestrictFieldForTempUser)
                                    {
                                        restricted = true;
                                        break;
                                    }
                                }
                            }
                            if (!restricted)
                            {
                                return Json(new { status = false, restrict = true, ex = Words.Users_MustSelectDocument });
                            }
                        }
                    }
                }

                if ((UserTypeEnum)user.Type.Value != UserTypeEnum.Temporary &&
                    user.Expire.HasValue)
                {
                    user.Expire = null;
                }

                Guid? ID = null;

                if (user.ID != Guid.Empty)
                {
                    Users oldUser = Users.Get(user.ID);

                    if (User.UserType != UserTypeEnum.Octacom)
                    {
                        // Super can't change other supers/octacom (only himself)
                        if (User.ID != oldUser.ID && User.UserType == UserTypeEnum.Super && oldUser.Type == (byte)UserTypeEnum.Super && oldUser.Type == (byte)UserTypeEnum.Octacom)
                        {
                            return Json(new { status = false });
                        }

                        // Admin can update only regular/temporary users (or himself)
                        if (User.UserType == UserTypeEnum.Administrator)
                        {
                            if (user.ID != User.ID && (oldUser.Type == (byte)UserTypeEnum.Administrator || oldUser.Type == (byte)UserTypeEnum.Octacom))
                            {
                                return Json(new { status = false });
                            }
                        }

                        if (user.Type == (byte)UserTypeEnum.Regular || user.Type == (byte)UserTypeEnum.Temporary)
                        {
                            if (user.Permissions.HasFlag(UserPermissionsEnum.ViewAudits))
                            {
                                user.Permissions &= ~UserPermissionsEnum.ViewAudits; // Remove the 'ViewAudits' permission
                            }
                        }

                        if (User.UserType == UserTypeEnum.Administrator)
                        {
                            if (!oldUser.Permissions.HasFlag(UserPermissionsEnum.ViewAudits) && user.Permissions.HasFlag(UserPermissionsEnum.ViewAudits))
                            {
                                user.Permissions &= ~UserPermissionsEnum.ViewAudits; // Remove the 'ViewAudits' permission
                            }
                        }

                        // Do not allow downgrade/upgrade Super/Octacom users
                        if (oldUser.Type == (byte)UserTypeEnum.Super || oldUser.Type == (byte)UserTypeEnum.Octacom)
                        {
                            if (user.Type != oldUser.Type)
                            {
                                user.Type = oldUser.Type;
                            }
                        }
                    }

                    ID = Users.UpdateUser(user);
                }
                else
                {
                    if (User.UserType != UserTypeEnum.Octacom)
                    {
                        // Super can't add other super
                        if (User.UserType == UserTypeEnum.Super && (user.Type == (byte)UserTypeEnum.Octacom || user.Type == (byte)UserTypeEnum.Super))
                        {
                            return Json(new { status = false });
                        }

                        // Administrator can't add octacom/super/administrator
                        if (User.UserType == UserTypeEnum.Administrator &&
                              (user.Type == (byte)UserTypeEnum.Octacom || user.Type == (byte)UserTypeEnum.Super || user.Type == (byte)UserTypeEnum.Administrator)
                           )
                        {
                            return Json(new { status = false });
                        }

                        if (user.Type == (byte)UserTypeEnum.Regular || user.Type == (byte)UserTypeEnum.Temporary)
                        {
                            if (user.Permissions.HasFlag(UserPermissionsEnum.ViewAudits))
                            {
                                user.Permissions &= ~UserPermissionsEnum.ViewAudits; // Remove the 'ViewAudits' permission
                            }
                        }

                        if (User.UserType == UserTypeEnum.Administrator)
                        {
                            if (user.Permissions.HasFlag(UserPermissionsEnum.ViewAudits))
                            {
                                user.Permissions &= UserPermissionsEnum.ViewAudits; // Remove the 'ViewAudits' permission
                            }
                        }
                    }

                    if (Users.HasNamedUsersLimit() && Users.IsNamedUsersExceeded())
                    {
                        Audit.Save(new Audit() { Action = AuditTypeEnum.UserCreateMaxNamedReached, Data = new { UserName = user.UserName } });

                        return Json(new { status = false, maximum = true, ex = Words.Users_LimitExceeded });
                    }

                    ID = Users.AddUser(user);
                }

                return ID.HasValue ? Json(new { status = true, id = ID }) : Json(new { status = false });
            }
            catch (Exception ex)
            {
                ex.Log();
                return Json(new { status = false, ex = ex.Message });
            }
        }

        /// <summary>
        /// Remove user
        /// </summary>
        /// <param name="id">User ID (Guid)</param>
        /// <returns></returns>
        [Authorize(Roles = AdminRoles)]
        public JsonResult Remove(Guid id)
        {
            // Users can't delete themselves
            if (User.ID == id)
            {
                return Json(new { status = false });
            }

            if (User.UserType != UserTypeEnum.Octacom)
            {
                Users user = Users.Get(id);

                if (User.UserType == UserTypeEnum.Super)
                {
                    // Super can't delete other octacom/super
                    if (user.Type == (byte)UserTypeEnum.Octacom || user.Type == (byte)UserTypeEnum.Super)
                    {
                        return Json(new { status = false });
                    }
                }
                else if (User.UserType == UserTypeEnum.Administrator)
                {
                    // Admin can't delete other octacom/uper/admin
                    if (user.Type == (byte)UserTypeEnum.Octacom || user.Type == (byte)UserTypeEnum.Super || user.Type == (byte)UserTypeEnum.Administrator)
                    {
                        return Json(new { status = false });
                    }
                }
            }

            bool removed = Users.Remove(id);

            return Json(new { status = removed });
        }

        /// <summary>
        /// Search for user Permissions (Used by autocomplete. Copy user permissions)
        /// </summary>
        /// <param name="query">User Name, User First/Last Name</param>
        /// <param name="idUser">Current User ID (Guid) - For editing</param>
        /// <returns></returns>
        [Authorize(Roles = AdminRoles)]
        public JsonResult SearchUserPermissions(string query, Guid? idUser)
        {
            return Json(new
            {
                query = query,
                suggestions = Users.SearchUserPermissions(query, idUser)
            }, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get all user permissions
        /// </summary>
        /// <param name="userId">User ID (Guid)</param>
        /// <returns></returns>
        [Authorize(Roles = AdminRoles)]
        public JsonResult GetUserPermissions(Guid userId)
        {
            return Json(Users.GetUserPermissions(userId));
        }

        /// <summary>
        /// Get user types
        /// </summary>
        /// <returns></returns>
        [Authorize(Roles = AdminRoles)]
        public JsonResult GetTypes()
        {
            return Json(new
            {
                UserPermissions = Enum.GetValues(typeof(AppUserPermission)).Cast<AppUserPermission>().ToDictionary(e => e.ToString(), e => Convert.ToInt32(e)),
                UserTypes = Users.GetUserTypes().Select(a => new { name = a.Text, value = int.Parse(a.Value) }).ToArray(),
                UserDefaultPermissions = Users.GetUserDefaultPermissions(),
                UserDefaultDocuments = Users.GetUserDefaultDocuments()
            });
        }

        [Authorize(Roles = AdminRoles)]
        public JsonResult UserAlreadyExist(string username)
        {
            return Json(Users.GetByUsername(username) != null);
        }

        [Authorize(Roles = AdminRoles)]
        public JsonResult EmailAlreadyRegistered(string email, Guid? currentUID)
        {
            var result = userRepository.EmailAlreadyRegistered(email, currentUID);

            return Json(result);
        }

        #endregion
    }
}