using Newtonsoft.Json;
using System;
using System.Web;

namespace Octacom.Odiss.ABCgroup.Web.Code
{
    public class ApplicationJsonConverter : JsonConverter
    {
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            string stringValue = HttpUtility.JavaScriptStringEncode(value.ToString());

            if (value.GetType() == typeof(string) == OdissHelper.IsValidJson(stringValue))
            {
                writer.WriteRawValue(stringValue.Replace("\\", ""));
            }
            else
            {
                writer.WriteValue(stringValue);
            }
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override bool CanConvert(Type objectType)
        {
            return typeof(string).IsAssignableFrom(objectType);
        }

        public override bool CanRead
        {
            get { return false; }
        }
    }
}