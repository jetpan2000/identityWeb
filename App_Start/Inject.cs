using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Reflection;
using System.Web.Http;
using System.Web.Mvc;
using Owin;
using SimpleInjector;
using SimpleInjector.Integration.Web.Mvc;
using SimpleInjector.Integration.WebApi;
using SimpleInjector.Integration.Web;
using Octacom.Odiss.Core.Business;
using Octacom.Odiss.Core.Contracts.Repositories;
using Octacom.Odiss.Core.Contracts.Services;
using Octacom.Odiss.Core.DataLayer;
using Octacom.Odiss.Core.DataLayer.Application;
using Octacom.Odiss.Core.DataLayer.User;
using Octacom.Odiss.Core.Contracts.Infrastructure;
using Octacom.Odiss.Core.Infrastructure.Odiss5;
using Octacom.Odiss.Core.DataLayer.Documents;
using Octacom.Odiss.Core.Contracts.Settings;
using Octacom.Odiss.Core.Settings;
using Octacom.Odiss.Core.Contracts.Validation;
using Octacom.Odiss.Core.Validation;
using Octacom.Odiss.Odiss5Adapters;
using Octacom.Odiss.ABCgroup.Web.Code;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.AP;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.Plants;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.Vendors;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories;
using Octacom.Odiss.ABCgroup.DataLayer.Repositories.Invoice;
using Octacom.Odiss.ABCgroup.DataLayer;
using Octacom.Odiss.ABCgroup.Business.Services;
using Octacom.Odiss.ABCgroup.Entities.Invoice.DocumentResults;
using Octacom.Odiss.ABCgroup.Web.Adapters;
using Octacom.Odiss.ABCgroup.Entities.Vendors;
using Octacom.Odiss.ABCgroup.Entities.Plants;
using Octacom.Odiss.ABCgroup.Entities.Invoice;
using Octacom.Odiss.ABCgroup.Entities.AP;
using Octacom.Odiss.ABCgroup.Business.CommandPattern;
using Octacom.Odiss.ABCgroup.Business.CommandPattern.Guards;
using Octacom.Odiss.ABCgroup.Business.CommandPattern.Handlers;
using Octacom.Odiss.ABCgroup.Business.Commands.Decorators;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class Inject
    {
        public static Container Container { get; private set; }

        public static void Register(IAppBuilder app)
        {
            Container = new Container();
            Container.Options.DefaultLifestyle = Lifestyle.Scoped;
            Container.Options.DefaultScopedLifestyle = new WebRequestLifestyle();
            Container.RegisterInstance<IServiceProvider>(Container);

            RegisterRepositories(Container);
            RegisterServices(Container);
            RegisterCommands(Container);
            //RegisterAdapters(Container);
            Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Startup.RegisterServices(app, Container);

            Container.RegisterMvcControllers(Assembly.GetExecutingAssembly());

            DependencyResolver.SetResolver(new SimpleInjectorDependencyResolver(Container));
            GlobalConfiguration.Configuration.DependencyResolver = new SimpleInjectorWebApiDependencyResolver(Container);
        }

        private static void RegisterServices(Container container)
        {
            container.Register<IDbContextFactory, DataContextFactory>();
            container.Register<IDbContextFactory<DbContext>, DataContextFactory>();
            container.Register<IConfigService, ConfigService>();
            container.Register<IUserService, ABCUserService>();
            container.Register<IABCUserService, ABCUserService>();
            container.Register<IInvoiceService, InvoiceService>();
            container.Register<Core.Contracts.Services.IApplicationService, ABCApplicationService>();
            container.Register<IStorageService, StorageService>();
            container.Register<IPrincipalService, ABCPrincipalService>();
            container.Register<IEmailService, EmailService>();
            container.Register<ILogger, OdissLogger>();
            container.Register<Core.Contracts.Infrastructure.ICachingService, InMemoryCache>();
            container.Register<ISettingsService, SettingsService>();
            container.Register<IFieldValidationProvider, FieldValidationProvider>();
            container.Register<Core.Contracts.Settings.IApplicationService, ApplicationService>();
            container.Register<IDocumentService<DocumentInvoice>, DocumentInvoiceService>();
            container.Register<IDocumentsAdapter, DocumentsAdapter>();
            container.Register<IDocumentActionService, DocumentActionService>();
            container.Register(typeof(IDocumentsAdapter<>), typeof(JetsDocumentsAdapter<>));
            container.RegisterConditional(typeof(IDocumentService<>), typeof(DocumentService<>), x => !x.Handled); // Fallback registration
            container.RegisterInitializer<IDocumentsAdapter>(adapter =>
            {
                adapter.SetMappings(new Dictionary<Guid, Type>
                {
                    { Guid.Parse("DBF11A7E-0BED-E811-822B-D89EF34A256D"), typeof(Invoice) },
                    { Guid.Parse("32567291-0BED-E811-822B-D89EF34A256D"), typeof(DocumentException) },
                    { Guid.Parse("A077CDA0-0BED-E811-822B-D89EF34A256D"), typeof(Archive) },
                    { Guid.Parse("EBF11A7E-0BED-E811-822B-D89EF34A256D"), typeof(VendorLocked) },
                });
            });

            container.Register<ApplicationTypeRegistry>();
            container.RegisterInitializer<Octacom.Odiss.Core.Settings.ApplicationTypeRegistry>(registry =>
            {
                registry.RegisterMappings(new Dictionary<Type, string>
                {
                    { typeof(VendorDto), "66a1f0a7-0bed-e811-822b-d89ef34a256d" },
                    { typeof(Vendor), "66a1f0a7-0bed-e811-822b-d89ef34a256d" },
                    { typeof(Plant), "339a1b33-b3ed-e811-822b-d89ef34a256d" },
                    { typeof(Invoice), "dbf11a7e-0bed-e811-822b-d89ef34a256d" },
                    { typeof(DocumentException), "32567291-0bed-e811-822b-d89ef34a256d" },
                    { typeof(Archive), "a077cda0-0bed-e811-822b-d89ef34a256d" }
                });
            });
        }

        private static void RegisterRepositories(Container container)
        {
            container.Register<IUserRepository, UserRepository>();
            container.Register<ISettingsRepository, SettingsRepository>();
            container.Register<IApplicationRepository, ApplicationRepository>();
            container.Register<IUserGroupRepository, UserGroupRepository>();
            container.Register<IUserDocumentRepository, UserDocumentRepository>();
            container.Register<IDatabaseRepository, DatabaseRepository>();
            container.Register<IFieldRepository, FieldRepository>();
            container.Register<IApplicationGridRepository, ApplicationGridRepository>();
            container.Register<IApplicationGridService, ApplicationGridService>();
            container.Register<IPlantRepository, PlantRepository>();
            container.Register<IAPRoleRepository, APRoleRepository>();
            container.Register<IAPUserRepository, APUserRepository>();
            container.Register<IVendorRepository, VendorRepository>();
            container.Register(typeof(ILookupTypeRepository<>), typeof(LookupTypeRepository<>));
            container.Register<IDocumentInvoiceRepository, DocumentInvoiceRepository>();
            container.Register<Core.Contracts.DataLayer.Repository.Document.IDocumentRepository<DocumentInvoice>, DocumentInvoiceRepository>();
            container.Register<Core.Contracts.DataLayer.Search.GlobalSearchEngine>();
            container.Register<Core.Contracts.DataLayer.Search.SearchEngineRegistry>();
            container.Register<Core.Contracts.DataLayer.Search.ISearchEngine<Invoice>, InvoiceSearchEngine>();
            container.Register<Core.Contracts.DataLayer.Search.ISearchEngine<VendorLocked>, VendorLockedDocumentSearchEngine>();
            container.Register<Core.Contracts.DataLayer.Search.ISearchEngine<DocumentException>, ExceptionSearchEngine>();
            container.Register<Core.Contracts.DataLayer.Search.ISearchEngine<Archive>, ArchiveSearchEngine>();
            container.Register<Core.Contracts.DataLayer.Search.ISearchEngine<Vendor>, VendorSearchEngine>();
            container.Register<Core.Contracts.DataLayer.Search.ISearchEngine<VendorDto>, VendorGridSearchEngine>();
            container.Register<Core.Contracts.DataLayer.Search.ISearchEngine<Plant>, PlantSearchEngine>();
            container.Register<Core.Contracts.DataLayer.Search.ISearchEngine<POHeader>, POHeaderSearchEngine>();
            container.RegisterConditional(typeof(Core.Contracts.DataLayer.Repository.Document.IDocumentRepository<>), typeof(Core.DataLayer.Repository.Document.EF.DocumentRepository<>), x => !x.Handled);
            container.RegisterConditional(typeof(IDocumentRepository<>), typeof(DocumentRepository<>), x => !x.Handled); // Fallback registration
            container.RegisterConditional(typeof(Core.Contracts.DataLayer.Search.ISearchEngine<>), typeof(Core.DataLayer.Search.EF.OdissSearchEngine<>), x => !x.Handled);
            container.RegisterConditional(typeof(ISearchEngine<>), typeof(OdissSearchEngine<>), x => !x.Handled); // Fallback registration

            container.RegisterInitializer<Core.Contracts.DataLayer.Search.SearchEngineRegistry>(registry =>
            {
                registry.RegisterMappings(new Dictionary<string, Type>
                {
                    { "POHeader", typeof(POHeader) },
                    { "Plant", typeof(Plant) },
                    { "Vendor", typeof(Vendor) }
                });
            });

            container.RegisterInitializer<IApplicationGridRepository>(repository =>
            {
                repository.SetMappings(new Dictionary<Guid, Type>
                {
                    { Guid.Parse("66A1F0A7-0BED-E811-822B-D89EF34A256D"), typeof(Vendor) },
                    { Guid.Parse("339A1B33-B3ED-E811-822B-D89EF34A256D"), typeof(Plant) }
                });
            });
        }

        private static void RegisterAdapters(Container container)
        {
            var adapterAssembly = typeof(UserAdapter).Assembly;

            var registrations =
                from type in adapterAssembly.GetExportedTypes()
                where type.Namespace.Contains(".Adapters")
                where type.GetInterfaces().Any()
                select new { Service = type.GetInterfaces().Single(), Implementation = type };

            foreach (var reg in registrations)
            {
                container.Register(reg.Service, reg.Implementation, Lifestyle.Scoped);
            }
        }

        private static void RegisterCommands(Container container)
        {
            container.Register(typeof(ICommandHandler<>), AppDomain.CurrentDomain.GetAssemblies());
            container.RegisterConditional(typeof(ICommandHandler<>), typeof(NoopCommandHandler<>), x => !x.Handled);

            // These decorators are to be applied to WorkflowCommandHandlers
            container.RegisterDecorator(typeof(ICommandHandler<>), typeof(SaveInvoiceCommandHandlerDecorator<>));
            container.RegisterDecorator(typeof(ICommandHandler<>), typeof(ClearExceptionsCommandHandlerDecorator<>));
            container.RegisterDecorator(typeof(ICommandHandler<>), typeof(UpdateInvoiceStatusCommandHandlerDecorator<>));
            container.RegisterDecorator(typeof(ICommandHandler<>), typeof(GuardedCommandHandlerDecorator<>));

            container.Register(typeof(ICommandGuard<>), AppDomain.CurrentDomain.GetAssemblies());
            container.RegisterConditional(typeof(ICommandGuard<>), typeof(PassThroughCommandGuard<>), x => !x.Handled);
            container.RegisterDecorator(typeof(ICommandGuard<>), typeof(UserAuthenticatedGuardDecorator<>));
            container.RegisterDecorator(typeof(ICommandGuard<>), typeof(DocumentCommandGuardDecorator<>));
            container.RegisterDecorator(typeof(ICommandGuard<>), typeof(WorkflowCommandGuardDecorator<>));
        }
    }
}