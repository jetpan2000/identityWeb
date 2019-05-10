using System;
using System.Collections.Generic;
using System.Linq;
using AutoMapper;
using Octacom.Odiss.Core.Contracts.Repositories;
using Octacom.Odiss.Core.Contracts.Repositories.Searching;
using Octacom.Odiss.Core.Contracts.Services;
using Octacom.Odiss.Core.Entities.User;
using Octacom.Odiss.Library;

namespace Octacom.Odiss.ABCgroup.Web.Adapters
{
    public class UserAdapter : IUserAdapter
    {
        private readonly IUserRepository userRepository;
        private readonly IApplicationRepository applicationRepository;
        private readonly IUserDocumentRepository userDocumentRepository;
        private readonly IConfigService configService;

        public UserAdapter(IUserRepository userRepository, IApplicationRepository applicationRepository, IUserDocumentRepository userDocumentRepository, IConfigService configService)
        {
            this.userRepository = userRepository;
            this.applicationRepository = applicationRepository;
            this.userDocumentRepository = userDocumentRepository;
            this.configService = configService;
        }

        public dynamic SearchAjax(bool? active = true, byte? userType = null, string userName = null, string firstName = null, string lastName = null, string sortBy = "UserName", int page = 0)
        {
            var appSettings = configService.GetApplicationSettings();

            var parameters = new UserSearchParameters()
            {
                Active = new SearchFilter<bool>(FilterType.Equals),
                UserName = new SearchFilter<string>(userName, FilterType.Like),
                FirstName = new SearchFilter<string>(firstName, FilterType.Like),
                LastName = new SearchFilter<string>(lastName, FilterType.Like),
                Type = new SearchFilter<byte?>(userType, FilterType.Equals),
                PageSize = appSettings.MaxPerPage
            };

            if (active.HasValue)
            {
                parameters.Active.Value = active.Value;
            }

            if (!string.IsNullOrEmpty(sortBy))
            {
                var sortSplit = sortBy.Split(',');

                var sortOperator = sortSplit.Length == 0 || sortSplit[1] == "asc"
                    ? SortOrder.Ascending
                    : SortOrder.Descending;

                switch (sortSplit[0].ToLower())
                {
                    case "2":
                        parameters.FirstName.SortOrder = sortOperator;
                        break;
                    case "3":
                        parameters.LastName.SortOrder = sortOperator;
                        break;
                    case "0":
                        parameters.UserName.SortOrder = sortOperator;
                        break;
                    case "1":
                        parameters.Type.SortOrder = sortOperator;
                        break;
                }
            }

            var result = userRepository.Search(parameters);

            return new
            {
                recordsTotal = result.TotalCount,
                recordsFiltered = result.FilteredCount,
                data = result.Records.Select(userRecord =>
                {
                    var row = new List<string>();

                    row.Add(userRecord.UserName);
                    row.Add(userRecord.Type != null
                        ? Enum.Parse(typeof(UserType), userRecord.Type.ToString()).ToString()
                        : "");
                    row.Add(userRecord.FirstName);
                    row.Add(userRecord.LastName);
                    row.Add(userRecord.Id.ToString());

                    return row;
                })
            };
        }

        public Users Get(object id)
        {
            Guid userId = (Guid)id;

            var user = userRepository.Get(userId);
            var applications = applicationRepository.GetByUserId(userId);
            var userDocuments = userDocumentRepository.GetByUserId(userId);
            var usersModel = Mapper.Map<Users>(user);
            usersModel.Applications = applications.Select(x => x.ID).ToArray();
            usersModel.Documents = Mapper.Map<Library.UserDocument[]>(userDocuments);

            return usersModel;
        }
    }
}