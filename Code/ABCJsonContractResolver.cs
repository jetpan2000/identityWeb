using System;
using System.Collections.Generic;
using System.Reflection;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Octacom.Odiss.ABCgroup.Web.Code
{
    public class ABCJsonContractResolver : CamelCasePropertyNamesContractResolver
    {
        protected override IValueProvider CreateMemberValueProvider(MemberInfo member)
        {
            return new ABCJsonValueProvider(base.CreateMemberValueProvider(member));
        }
    }

    public class ABCJsonValueProvider : IValueProvider
    {
        private readonly IValueProvider defaultProvider;

        public ABCJsonValueProvider(IValueProvider defaultProvider)
        {
            this.defaultProvider = defaultProvider;
        }

        public object GetValue(object target)
        {
            throw new NotImplementedException();
        }

        public void SetValue(object target, object value)
        {
            defaultProvider.SetValue(target, value);
        }
    }
}