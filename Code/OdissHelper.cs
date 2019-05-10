using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Octacom.Odiss.ABCgroup.Web.Models;
using Octacom.Odiss.Library;

namespace Octacom.Odiss.ABCgroup.Web.Code
{
    public static class OdissHelper
    {
        public static Guid? GetApplicationIdFromReferrer(this HttpRequestMessage request)
        {
            var url = request.Headers.Referrer;
            return GetApplicationIdFromUri(request.Headers.Referrer);
        }

        public static Guid? GetApplicationIdFromUri(this Uri uri)
        {
            var regex = new Regex(@"app/(.*?)(/|\z)", RegexOptions.IgnoreCase);
            var match = regex.Match(uri.ToString());
            var appId = match.Groups[1].ToString();

            Guid.TryParse(appId, out var result);

            if (result == default(Guid))
            {
                return null;
            }
            else
            {
                return result;
            }
        }

        public static bool IsValidJson(string strInput)
        {
            strInput = strInput.Trim();
            if ((strInput.StartsWith("{") && strInput.EndsWith("}")) || //For object
                (strInput.StartsWith("[") && strInput.EndsWith("]"))) //For array
            {
                try
                {
                    var obj = JToken.Parse(strInput);
                    return true;
                }
                catch (JsonReaderException jex)
                {
                    //Exception in parsing json
                    Console.WriteLine(jex.Message);
                    return false;
                }
                catch (Exception ex) //some other exception
                {
                    Console.WriteLine(ex.ToString());
                    return false;
                }
            }
            else
            {
                return false;
            }
        }

        public static string GetAppDataJson(this Settings.Application apConfig)
        {
            return apConfig.ToJson();
        }

        public static string ToJson(this object obj)
        {
            return JsonConvert.SerializeObject(obj, new JsonSerializerSettings
            {
                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                StringEscapeHandling = StringEscapeHandling.EscapeHtml,
                Converters = new[] { new ApplicationJsonConverter() }
            });
        }

        public static DocumentApplication GetDocumentApplication(Guid appId)
        {
            if (appId == new Guid("DBF11A7E-0BED-E811-822B-D89EF34A256D"))
            {
                return DocumentApplication.InvoiceManagement;
            }
            else if (appId == new Guid("32567291-0BED-E811-822B-D89EF34A256D"))
            {
                return DocumentApplication.Exceptions;
            }
            else if (appId == new Guid("A077CDA0-0BED-E811-822B-D89EF34A256D"))
            {
                return DocumentApplication.Archive;
            }
            else
            {
                return DocumentApplication.None;
            }
        }
    }
}