using AutoMapper;
using Octacom.Odiss.ABCgroup.Entities.AP;
using Octacom.Odiss.ABCgroup.Entities.Common;
using Octacom.Odiss.ABCgroup.Entities.Plants;
using Octacom.Odiss.ABCgroup.Entities.Vendors;
using Octacom.Odiss.Core.Entities.User;
using Octacom.Odiss.Library;
using System.Linq;

namespace Octacom.Odiss.ABCgroup.Web
{
    public class MappingRegistrations
    {
        public static void Register()
        {
            Mapper.Initialize(cfg =>
            {
                cfg.CreateMap<User, Users>();
                cfg.CreateMap<Core.Entities.User.UserDocument, Library.UserDocument>();
                cfg.CreateMap<Core.Entities.User.UserPermission, Library.UserPermissionsEnum>();
                cfg.CreateMap<APUser, APUserDto>()
                    .ForMember(m => m.UserId, opt => opt.MapFrom(src => src.UserId))
                    .ForMember(m => m.Username, opt => opt.MapFrom(src => src.User.UserName))
                    .ForMember(m => m.APRole, opt => opt.MapFrom(src => src.APRoleCode))
                    .ForMember(m => m.Plants, opt => opt.MapFrom(src => src.UserPlants.Select(up => up.Plant)));
                cfg.CreateMap<APUserDto, APUser>()
                    .ForMember(m => m.APRoleCode, opt => opt.MapFrom(src => src.APRole))
                    .ForMember(m => m.APRole, opt => opt.Ignore())
                    .ForMember(m => m.UserId, opt => opt.MapFrom(src => src.UserId))
                    .ForMember(m => m.UserPlants, opt => opt.MapFrom(src => src.Plants));
                cfg.CreateMap<Plant, APUserPlant>()
                    .ForMember(m => m.PlantId, opt => opt.MapFrom(src => src.Id));
            });
        }
    }
}