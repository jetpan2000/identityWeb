using System.Web.Optimization;

namespace Octacom.Odiss.ABCgroup.Web
{
    /// <summary>
    /// Bundles for CSS and JS files
    /// </summary>
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            var isCustomCssEnabled = false;

            if (Library.Config.ConfigBase.Settings != null &&
                Library.Config.ConfigBase.Settings.CustomCSS)
                isCustomCssEnabled = true;

            #region Layout

            // JS - Base
            bundles.Add(new GZipScriptBundle("~/content/min/js/base", new JsMinify())
                .Include("~/Content/js/libs/jquery-1.11.3.min.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                .Include("~/Content/js/libs/bootstrap.min.js")
                .Include("~/Content/js/libs/jquery.mask.min.js")
                .Include("~/Content/js/base.js")
                .Include("~/Scripts/lodash.min.js")
                .Include("~/Scripts/postal.min.js")
                );

            // CSS - Base
            var gz_css_base = new GZipStyleBundle("~/content/min/css/base", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/custom.css");

            if (isCustomCssEnabled)
                gz_css_base.Include("~/Content/css/custom_client.css");

            bundles.Add(gz_css_base);

            // JS - Angular
            bundles.Add(new GZipScriptBundle("~/content/min/js/angular", new JsMinify())
                .Include("~/Scripts/angular.min.js")
                );

            // JS - IE8
            bundles.Add(new GZipScriptBundle("~/content/min/js/ie8", new JsMinify())
                .Include("~/Content/js/libs/html5shiv-3.7.2.min.js")
                .Include("~/Content/js/libs/respond-1.4.2.min.js")
                );

            #endregion

            #region Login

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/login", new JsMinify())
                .Include("~/Content/js/libs/jquery-1.11.3.min.js")
                .Include("~/Content/js/libs/bootstrap.min.js")
                .Include("~/Content/js/libs/jquery.mask.min.js")
                .Include("~/Content/js/login.js")
                );

            // CSS
            var gz_css_login = new GZipStyleBundle("~/content/min/css/login", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/custom.css")
                .Include("~/Content/css/login.css");

            if (isCustomCssEnabled)
            {
                gz_css_login.Include("~/Content/css/custom_client.css");
                gz_css_login.Include("~/Content/css/login_client.css");
            }

            bundles.Add(gz_css_login);
            #endregion

            #region Change Password

            // JS
            /*
            bundles.Add(new GZipScriptBundle("~/content/min/js/changepassword", new JsMinify())
                .Include("~/content/js/changepassword.js")
                );
            */

            // CSS
            var gz_css_changepassword = new GZipStyleBundle("~/content/min/css/changepassword", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/custom.css")
                .Include("~/Content/css/changepassword.css");

            if (isCustomCssEnabled)
                gz_css_changepassword.Include("~/Content/css/custom_client.css");

            bundles.Add(gz_css_changepassword);

            #endregion

            #region App

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/app", new JsMinify())
                .Include("~/Content/js/libs/jquery.dataTables.min.js")
                .Include("~/Content/js/libs/dataTables.buttons.min.js")
                .Include("~/Content/js/libs/buttons.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.responsive.min.js")
                .Include("~/Content/js/libs/dataTables.locale.js")
                .Include("~/Content/js/libs/dataTables.conditionalPaging.js")
                .Include("~/Content/js/libs/dataTables.fixedHeader.min.js")
                //.Include("~/Content/js/libs/buttons.html5.min.js")
                .Include("~/Content/js/libs/jquery.validate.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/jstree.min.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                .Include("~/Content/js/libs/bootstrap-notify.js")
                .Include("~/Content/js/app.js")
                );

            // JS Custom
            bundles.Add(new GZipScriptBundle("~/content/min/js/appcustom", new JsMinify())
                .Include("~/Content/js/libs/jquery.dataTables.min.js")
                .Include("~/Content/js/libs/dataTables.buttons.min.js")
                .Include("~/Content/js/libs/buttons.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.responsive.min.js")
                .Include("~/Content/js/libs/dataTables.locale.js")
                .Include("~/Content/js/libs/dataTables.conditionalPaging.js")
                .Include("~/Content/js/libs/dataTables.fixedHeader.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/jstree.min.js")
                .Include("~/Content/js/libs/bootstrap-notify.js")
                );

            // CSS
            bundles.Add(new GZipStyleBundle("~/content/min/css/app", new CssMinify())
                .Include("~/Content/css/libs/dataTables.bootstrap.min.css")
                .Include("~/Content/css/libs/responsive.bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/jstree.min.css")
                .Include("~/Content/css/libs/buttons.bootstrap.min.css")
                .Include("~/Content/css/libs/fixedHeader.dataTables.min.css")
                .Include("~/Content/css/app.css")
                );

            // CSS Custom
            bundles.Add(new GZipStyleBundle("~/content/min/css/appcustom", new CssMinify())
                .Include("~/Content/css/libs/dataTables.bootstrap.min.css")
                .Include("~/Content/css/libs/responsive.bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/jstree.min.css")
                .Include("~/Content/css/libs/buttons.bootstrap.min.css")
                .Include("~/Content/css/libs/fixedHeader.dataTables.min.css")
                );

            #endregion

            #region APForm

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/apform", new JsMinify())
                .Include("~/Content/js/libs/jquery.dataTables.min.js")
                .Include("~/Content/js/libs/dataTables.buttons.min.js")
                .Include("~/Content/js/libs/buttons.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.responsive.min.js")
                .Include("~/Content/js/libs/dataTables.locale.js")
                .Include("~/Content/js/libs/dataTables.conditionalPaging.js")
                .Include("~/Content/js/libs/buttons.html5.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/jstree.min.js")
                .Include("~/Content/js/libs/jquery.validate.min.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                .Include("~/Content/js/apform.js")
                );

            // CSS
            bundles.Add(new GZipStyleBundle("~/content/min/css/apform", new CssMinify())
                .Include("~/Content/css/libs/dataTables.bootstrap.min.css")
                .Include("~/Content/css/libs/responsive.bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/jstree.min.css")
                .Include("~/Content/css/libs/buttons.bootstrap.min.css")
                .Include("~/Content/css/apform.css")
                );

            #endregion

            #region EditForm

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/editform", new JsMinify())
                .Include("~/Content/js/libs/jquery.dataTables.min.js")
                .Include("~/Content/js/libs/dataTables.buttons.min.js")
                .Include("~/Content/js/libs/buttons.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.responsive.min.js")
                .Include("~/Content/js/libs/dataTables.locale.js")
                .Include("~/Content/js/libs/dataTables.conditionalPaging.js")
                .Include("~/Content/js/libs/buttons.html5.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/jstree.min.js")
                .Include("~/Content/js/libs/jquery.validate.min.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                .Include("~/Content/js/editform.js")
                );

            // CSS
            bundles.Add(new GZipStyleBundle("~/content/min/css/editform", new CssMinify())
                .Include("~/Content/css/libs/dataTables.bootstrap.min.css")
                .Include("~/Content/css/libs/responsive.bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/jstree.min.css")
                .Include("~/Content/css/libs/buttons.bootstrap.min.css")
                .Include("~/Content/css/editform.css")
                );

            #endregion

            #region Submit Base

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/submitbase", new JsMinify())
                .Include("~/Content/js/libs/jquery-1.11.3.min.js")
                .Include("~/Content/js/libs/bootstrap.min.js")
                .Include("~/Content/js/libs/jquery.mask.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/dropzone.js")
                .Include("~/Content/js/libs/bootstrap.validator.js")
                .Include("~/Content/js/submitbase.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                );

            // JS Custom
            bundles.Add(new GZipScriptBundle("~/content/min/js/submitbasecustom", new JsMinify())
                .Include("~/Content/js/libs/jquery-1.11.3.min.js")
                .Include("~/Content/js/libs/bootstrap.min.js")
                .Include("~/Content/js/libs/jquery.mask.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/dropzone.js")
                .Include("~/Content/js/libs/bootstrap.validator.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                );

            // CSS
            var gz_css_submitbase = new GZipStyleBundle("~/content/min/css/submitbase", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/dropzone.css")
                .Include("~/Content/css/submit.css")
                .Include("~/Content/css/viewer.css");

            if (isCustomCssEnabled)
                gz_css_submitbase.Include("~/Content/css/submit_client.css");

            bundles.Add(gz_css_submitbase);

            #endregion

            #region Upload

            bundles.Add(new GZipScriptBundle("~/content/min/js/upload", new JsMinify())
                .Include("~/Content/js/libs/dropzone.js")
                .Include("~/Content/js/libs/bootstrap.validator.js")
                .Include("~/content/js/upload.js")
                );

            #endregion

            #region Viewer Base

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/viewerbase", new JsMinify())
                .Include("~/Content/js/libs/jquery-1.11.3.min.js")
                .Include("~/Content/js/libs/bootstrap.min.js")
                .Include("~/Content/js/libs/jquery.mask.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/jquery.validate.min.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                .Include("~/Content/js/libs/livestamp.min.js")
                .Include("~/Content/js/viewerbase.js")
                );

            // CSS
            var gz_css_viewerbase = new GZipStyleBundle("~/content/min/css/viewerbase", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/viewer.css");

            if (isCustomCssEnabled)
                gz_css_viewerbase.Include("~/Content/css/viewer_client.css");

            bundles.Add(gz_css_viewerbase);

            #endregion

            #region Custom

            var gz_css_viewercustom = new GZipStyleBundle("~/content/min/css/viewercustom", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/viewercustom.css");

            if (isCustomCssEnabled)
                gz_css_viewercustom.Include("~/Content/css/custom_client.css");

            bundles.Add(gz_css_viewercustom);

            #endregion

            #region APForm Viewer Base

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/apformviewerbase", new JsMinify())
                .Include("~/Content/js/libs/jquery-1.11.3.min.js")
                .Include("~/Content/js/libs/bootstrap.min.js")
                .Include("~/Content/js/libs/jquery.mask.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/dropzone.js")
                .Include("~/Content/js/libs/jquery.validate.min.js")
                .Include("~/Content/js/apformviewerbase.js")
                );

            // CSS
            bundles.Add(new GZipStyleBundle("~/content/min/css/apformviewerbase", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/dropzone.css")
                .Include("~/Content/css/apform.css")
                .Include("~/Content/css/apformviewerbase.css")
                );

            #endregion

            #region EditForm Viewer Base

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/editformviewerbase", new JsMinify())
                .Include("~/Content/js/libs/jquery-1.11.3.min.js")
                .Include("~/Content/js/libs/bootstrap.min.js")
                .Include("~/Content/js/libs/jquery.mask.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/dropzone.js")
                .Include("~/Content/js/libs/jquery.validate.min.js")
                .Include("~/Content/js/editformviewerbase.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                );

            // CSS
            var gz_css_editformviewerbase = new GZipStyleBundle("~/content/min/css/editformviewerbase", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/dropzone.css")
                .Include("~/Content/css/editform.css")
                .Include("~/Content/css/editformviewerbase.css");

            if (isCustomCssEnabled)
                gz_css_editformviewerbase.Include("~/Content/css/editformviewerbase_client.css");

            bundles.Add(gz_css_editformviewerbase);

            #endregion

            #region Settings

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/settings", new JsMinify())
                .Include("~/Content/js/libs/jstree.min.js")
                .Include("~/Content/js/libs/jstreegrid.js")
                .Include("~/Content/js/settings.js")
                );

            // CSS
            bundles.Add(new GZipStyleBundle("~/content/min/css/settings", new CssMinify())
                .Include("~/Content/css/libs/jstree.min.css")
                .Include("~/Content/css/settings.css")
                );

            #endregion

            #region Users

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/users", new JsMinify())
                .Include("~/Content/js/libs/jquery.dataTables.min.js")
                .Include("~/Content/js/libs/dataTables.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.locale.js")
                .Include("~/Content/js/libs/dataTables.conditionalPaging.js")
                .Include("~/Content/js/libs/jstree.min.js")
                .Include("~/Content/js/libs/jquery.validate.min.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                .Include("~/Content/js/an-bitmask.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/ng-tags-input.min.js")
                .Include("~/Content/js/users.js")
                );

            // CSS
            bundles.Add(new GZipStyleBundle("~/content/min/css/users", new CssMinify())
                .Include("~/Content/css/libs/dataTables.bootstrap.min.css")
                .Include("~/Content/css/libs/jstree.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/ng-tags-input.min.css")
                .Include("~/Content/css/libs/ng-tags-input.bootstrap.min.css")
                .Include("~/Content/css/users.css")
                );

            #endregion

            #region Audit

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/audit", new JsMinify())
                .Include("~/Content/js/libs/jquery.dataTables.min.js")
                .Include("~/Content/js/libs/dataTables.buttons.min.js")
                .Include("~/Content/js/libs/buttons.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.bootstrap.min.js")
                .Include("~/Content/js/libs/dataTables.conditionalPaging.js")
                .Include("~/Content/js/libs/dataTables.fixedHeader.min.js")
                .Include("~/Content/js/libs/dataTables.locale.js")
                .Include("~/Content/js/libs/buttons.html5.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/jstree.min.js")
                .Include("~/Content/js/libs/chart-2.1.6.min.js")
                //.Include("~/Content/js/libs/fullcalendar.min.js")
                .Include("~/Content/js/libs/jquery.fileDownload.js")
                .Include("~/Content/js/jsonToTable.js")
                .Include("~/Content/js/audit.js")
                );

            // CSS
            bundles.Add(new GZipStyleBundle("~/content/min/css/audit", new CssMinify())
                .Include("~/Content/css/libs/dataTables.bootstrap.min.css")
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/libs/jstree.min.css")
                .Include("~/Content/css/libs/buttons.bootstrap.min.css")
                .Include("~/Content/css/libs/fixedHeader.dataTables.min.css")
                //.Include("~/Content/css/libs/fullcalendar.min.css")
                .Include("~/Content/css/jsonToTable.css")
                .Include("~/Content/css/audit.css")
                );

            #endregion

            #region Reports

            // JS
            bundles.Add(new GZipScriptBundle("~/content/min/js/reports", new JsMinify())
                .Include("~/Content/js/libs/chart-2.1.6.min.js")
                .Include("~/Content/js/libs/chart-PieceLabel.min.js")
                .Include("~/Content/js/libs/moment-with-locales.js")
                .Include("~/Content/js/libs/daterangepicker.js")
                .Include("~/Content/js/libs/daterangepicker.locale.js")
                .Include("~/Content/js/libs/jquery.fileDownload.js")
                .Include("~/Content/js/libs/canvasloader-min.js")
                .Include("~/Content/js/libs/jquery.autocomplete.min.js")
                .Include("~/Content/js/reports.js")
                );

            // CSS
            bundles.Add(new GZipStyleBundle("~/content/min/css/reports", new CssMinify())
                .Include("~/Content/css/libs/daterangepicker.css")
                .Include("~/Content/css/reports.css")
                );

            #endregion

            #region Error

            // CSS
            var gz_css_error = new GZipStyleBundle("~/content/min/css/error", new CssMinify())
                .Include("~/Content/css/libs/bootstrap.min.css")
                .Include("~/Content/css/custom.css")
                .Include("~/Content/css/error.css");

            if (isCustomCssEnabled)
                gz_css_error.Include("~/Content/css/custom_client.css");

            bundles.Add(gz_css_error);

            #endregion

#if DEBUG
            BundleTable.EnableOptimizations = false;
#else
            BundleTable.EnableOptimizations = true;
#endif
        }
    }
}