using Octacom.Odiss.Library;

namespace Octacom.Odiss.ABCgroup.Web.Adapters
{
    public interface IUserAdapter
    {
        dynamic SearchAjax(bool? active = true, byte? userType = null, string userName = null, string firstName = null, string lastName = null, string sortBy = "UserName", int page = 0);
        Users Get(object id);
    }
}
