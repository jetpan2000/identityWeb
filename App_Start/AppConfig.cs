using System.Linq;
using System.Web;
using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Config;
using EX = StackExchange.Exceptional;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class AppConfig
    {
        /// <summary>
        /// Load base settings from Database
        /// </summary>
        /// <param name="app">Context HttpApplication</param>
        public static void Start(System.Web.HttpApplication app)
        {
            if (app?.Application == null) return;

            var settings = new Settings();
            settings.LoadFromDB();
            ConfigBase.Settings = settings;

            if (Settings.IsExceptionLogEnabled)
            {
                if (settings.MainConnectionString.HasValue())
                {
                    EX.ErrorStore.Setup(settings.Name, new EX.Stores.SQLErrorStore(settings.MainConnectionString));
                }
            }

            Dapper.SqlMapper.Settings.CommandTimeout = 60;

            if (HttpContext.Current.IsDebuggingEnabled)
                Dapper.SqlMapper.Settings.CommandTimeout = 30;
        }
    }
}