using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(Octacom.Odiss.ABCgroup.Web.Startup))]
namespace Octacom.Odiss.ABCgroup.Web
{
    
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            Inject.Register(app);
            Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Startup.SetupOwin(app, Inject.Container);
        }
    }
}