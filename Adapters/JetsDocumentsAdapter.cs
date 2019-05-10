using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web.Mvc;
using Newtonsoft.Json.Linq;
using Octacom.Odiss.Core.Contracts.DataLayer.Search;
using Octacom.Odiss.Core.Odiss5Adapters;
using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Auth;
using Octacom.Odiss.Library.Config;
using Octacom.Odiss.Odiss5Adapters;
using LibrarySettings = Octacom.Odiss.Library.Settings;

namespace Octacom.Odiss.ABCgroup.Web.Adapters
{
    public class JetsDocumentsAdapter<TDocument> : IDocumentsAdapter<TDocument>
    {
        private readonly ISearchEngine<TDocument> documentSearchEngine;
        private readonly GlobalSearchEngine searchEngine;
        private readonly SearchEngineRegistry searchEngineRegistry;

        public JetsDocumentsAdapter(ISearchEngine<TDocument> documentSearchEngine, GlobalSearchEngine searchEngine, SearchEngineRegistry searchEngineRegistry)
        {
            this.documentSearchEngine = documentSearchEngine;
            this.searchEngine = searchEngine;
            this.searchEngineRegistry = searchEngineRegistry;
        }

        public dynamic GetResults(LibrarySettings.Application app, FormCollection form, AuthPrincipal user, int page = 0, string sort = "")
        {
            if (page == 0)
            {
                return new
                {
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<List<string>>()
                };
            }

            IDictionary<string, object> searchParameters = BuildSearchParameters(app.Fields, form);
            var sortings = BuildSorting(sort, app.Fields);
            var searchOptions = new SearchOptions
            {
                SearchParameters = searchParameters,
                Page = page,
                Sortings = sortings
            };

            var searchResult = documentSearchEngine.Search(searchOptions);
            var dataTableResults = GetDataTableResults(searchResult.Records, app, form, user);

            return new
            {
                recordsTotal = searchResult.TotalCount,
                recordsFiltered = searchResult.FilteredCount,
                data = dataTableResults
            };
        }

        private IDictionary<string, SortOrder> BuildSorting(string sortString, LibrarySettings.Field[] fields)
        {
            if (string.IsNullOrEmpty(sortString))
            {
                return null;
            }

            var valueSplit = sortString.Split(',');

            if (valueSplit.Length != 2)
            {
                return null;
            }

            int columnPosition;

            try
            {
                columnPosition = int.Parse(valueSplit[0]);
            }
            catch (FormatException)
            {
                return null;
            }

            var column = fields[columnPosition - 1];

            var sortOrder = SortOrder.None;

            if (valueSplit[1] == "asc")
            {
                sortOrder = SortOrder.Ascending;
            }
            else if (valueSplit[1] == "desc")
            {
                sortOrder = SortOrder.Descending;
            }

            return new Dictionary<string, SortOrder>
            {
                { column.DBColumnName, sortOrder }
            };
        }

        private IDictionary<string, object> BuildSearchParameters(LibrarySettings.Field[] fields, FormCollection form)
        {
            var result = new Dictionary<string, object>();

            var fieldsFiltered = fields.Where(a =>
                (a.VisibilityType == FieldVisibilityTypeEnum.Always ||
                a.VisibilityType == FieldVisibilityTypeEnum.SearchFilter) &&
                !a.NotVisibleFilter);

            foreach (var field in fields)
            {
                string fieldName = field.DBColumnName;
                string fieldId = field.ViewColumnID;
                string formValue = form[field.ViewColumnID];
                var value = GetValue(field, form);               

                if (value == null)
                {
                    continue;
                }

                string searchField = GetSearchField(field);

                if (value.GetType() == typeof(DateTime[]) && ((DateTime[])value).Length == 2 && formValue.Contains(" - "))
                {
                    searchField = $"{searchField}.Between";
                }
                else if (field.Type == FieldTypeEnum.NumberRange && ((decimal[])value).Length == 2)
                {
                    searchField = $"{searchField}.Between";
                }

                result.Add(searchField, value);
            }

            return result;
        }

        private static bool TryParseDateRange(object value, out DateTime startDate, out DateTime endDate)
        {
            startDate = default(DateTime);
            endDate = default(DateTime);

            if (value.GetType() != typeof(string))
            {
                return false;
            }

            string stringValue = (string)value;

            var dateRangeSplit = stringValue.Split(new string[] { " - " }, StringSplitOptions.RemoveEmptyEntries);

            if (dateRangeSplit.Length != 2)
            {
                return false;
            }

            bool startDateSuccess = DateTime.TryParse(dateRangeSplit[0], out startDate);
            bool endDateSuccess = DateTime.TryParse(dateRangeSplit[1], out endDate);
            endDate = new DateTime(endDate.Year, endDate.Month, endDate.Day, 23, 59, 59, 999);

            return startDateSuccess && endDateSuccess;
        }

        private object GetValue(LibrarySettings.Field field, FormCollection form)
        {
            string fieldId = field.ViewColumnID;
            string hiddenFormValue = form["hidden" + fieldId];
            string formValue = "";

            if (field.Type == FieldTypeEnum.NumberRange)
            {// it has two values saved in two form fields named with fieldId:  f934fb3f-984c-e811-9c6f-bc305bb8042d[0] f934fb3f-984c-e811-9c6f-bc305bb8042d[1]
                string fromValue = form[fieldId + "[0]"];
                string toValue = form[fieldId + "[1]"];

                if (string.IsNullOrWhiteSpace(fromValue) && string.IsNullOrWhiteSpace(toValue))
                    return null;

                decimal[] values = new decimal[2];
                values[0] = string.IsNullOrWhiteSpace(fromValue) ? decimal.MinValue : Convert.ToDecimal(fromValue);
                values[1] = string.IsNullOrWhiteSpace(toValue) ? decimal.MaxValue : Convert.ToDecimal(toValue); ;

                return values;
            }
            else
            {
                formValue = form[fieldId];
            }

            var stringValue = !string.IsNullOrEmpty(hiddenFormValue) ? hiddenFormValue : formValue;                     

            if (string.IsNullOrEmpty(stringValue))
            {
                return null;
            }

            var mapToSplit = field.DBColumnName.Split('.');

            var property = typeof(TDocument).GetProperty(mapToSplit[0]);

            if (property == null)
            {
                return null;
            }

            string searchField = GetSearchField(field);

            return GetValue(stringValue, searchField, property.PropertyType, false);
        }

        private static JObject GetSearchObject(LibrarySettings.Field field)
        {
            if (string.IsNullOrEmpty(field.FilterData))
            {
                return null;
            }

            var filterData = !string.IsNullOrEmpty(field.FilterData) ? JObject.Parse(field.FilterData) : null;

            if (!filterData.ContainsKey("search"))
            {
                return null;
            }

            return filterData["search"] as JObject;
        }

        private string GetSearchField(LibrarySettings.Field field)
        {
            var search = GetSearchObject(field);

            if (search == null || !search.ContainsKey("searchFields"))
            {
                return field.DBColumnName;
            }

            var searchFields = search["searchFields"];

            if (search.ContainsKey("entityName"))
            {
                string entityName = search["entityName"].ToString();

                // Figure out now if we have the situation where the search needs to be performed on a navigation property
                // There are two things that we allow on the entity.
                // 1. A navigation property of same name as entityName
                // 2. A search property named {EntityName}{EntityPropertyName} (e.g. PlantName)

                // if these situations occur then the contents of searchFields delimited by AND or OR must have the prefixes added for each of the situations

                var searchEntityType = this.searchEngineRegistry.GetEntityType(entityName);

                return BuildNavigationParameterForField(searchFields.ToString(), searchEntityType, typeof(TDocument));
            }
            else
            {
                return searchFields.ToString();
            }
        }

        private static string BuildNavigationParameterForField(string searchFieldsString, Type searchEntityType, Type engineEntity)
        {
            var properties = engineEntity.GetProperties();
            var navigationProperty = properties.FirstOrDefault(x => x.Name == searchEntityType.Name);

            string logicalSeparatorPattern = @"(?:^|[ ])(.*?)($| AND| OR)";

            return Regex.Replace(searchFieldsString, logicalSeparatorPattern, delegate (Match match)
            {
                string suffix = match.Groups[2].Value;
                if (suffix.Length > 0)
                {
                    suffix += " ";
                }

                var value = match.Groups[1].Value + suffix;

                if (navigationProperty != null)
                {
                    return $"{navigationProperty.Name}.{value}";
                }
                else
                {
                    var dotSplit = value.Split('.'); // TODO - Modify the regular expression to use a capture group for this instead (quick hack for now)
                    string matchPropertyName = $"{searchEntityType.Name}{dotSplit[0]}";
                    string afterPropertyName = string.Join("", dotSplit.Skip(1));

                    if (afterPropertyName.Length > 0)
                    {
                        afterPropertyName = "." + afterPropertyName;
                    }

                    var matchProperty = properties.FirstOrDefault(x => x.Name == matchPropertyName);

                    if (matchProperty == null)
                    {
                        return null; // Can't use this property as it doesn't exist so we avoid searching for it
                    }
                    else
                    {
                        return $"{matchPropertyName}{afterPropertyName}";
                    }
                }
            });
        }

        private object GetValue(string stringValue, string mapTo, Type propertyType, bool asArray)
        {
            var mapToSplit = mapTo.Split('.');

            var splitParts = stringValue.Split(',');

            if (propertyType.IsGenericType && propertyType.GetGenericTypeDefinition() == typeof(ICollection<>))
            {
                var collectionType = propertyType.GetGenericArguments().Single();
                var match = Regex.Match(mapTo, @"(.*?)\.(.*?)\((.*?)\.(.*?)\)");

                if (match.Length > 1)
                {
                    return GetValue(stringValue, match.Groups[3].Value, collectionType, true);
                }
            }
            else if (!propertyType.IsPrimitive && propertyType != typeof(string) && !propertyType.IsAssignableFrom(typeof(DateTime)))
            {
                var property = propertyType.GetProperty(mapToSplit[0]);

                if (property == null)
                {
                    return null;
                }

                return GetValue(stringValue, mapTo, property.PropertyType, asArray);
            }

            try
            {
                if (asArray)
                {
                    if (propertyType == typeof(string))
                    {
                        return splitParts.Select(part => part.Trim('\'')).ToArray();
                    }
                    else
                    {
                        return splitParts.Select(part => GetValueForType(part, propertyType)).ToArray();
                    }
                }
                else
                {
                    return GetValueForType(stringValue, propertyType);
                }
            }
            catch (InvalidCastException) { }
            catch (FormatException) { }

            return null;
        }

        private static object GetValueForType(string stringValue, Type type)
        {
            if (type.IsAssignableFrom(typeof(DateTime)))
            {
                if (TryParseDateRange(stringValue, out var startDate, out var endDate))
                {
                    return new DateTime[] { startDate, endDate };
                }
                else if (DateTime.TryParse(stringValue, out var dateTime))
                {
                    return dateTime;
                }
            }

            return Convert.ChangeType(stringValue, type);
        }

        private IEnumerable<Dictionary<string, object>> ConvertToDynamicResults<TEntity>(IEnumerable<TEntity> entities, LibrarySettings.Application app)
        {
            var type = typeof(TEntity);
            var properties = type.GetProperties();
            return entities.Select(entity =>
            {
                var result = new Dictionary<string, object>();

                foreach (var propInfo in properties)
                {
                    result.Add(propInfo.Name, propInfo.GetValue(entity));
                }

                return result;
            });
        }

        private List<List<string>> GetDataTableResults(IEnumerable<TDocument> documents, LibrarySettings.Application app, FormCollection form, AuthPrincipal user)
        {
            // The body of this method is mostly a copy paste of what was in Odiss.Library to transform the data results for the Grid control

            List<List<string>> dataTableResults = new List<List<string>>();

            bool showViewer = true;
            var showNotes = UserPermissionsEnum.ViewNotes.IsUserAuthorized(user);
            var fieldsOrdered = app.Fields.Where(a => a.VisibilityType == FieldVisibilityTypeEnum.Always || a.VisibilityType == FieldVisibilityTypeEnum.SearchResults || a.VisibilityType == FieldVisibilityTypeEnum.OnlySearchResults)
                .OrderBy(a => a.ResultOrder)
                .ToArray();

            var results = ConvertToDynamicResults(documents, app);

            foreach (var row in results)
            {
                List<string> dataRow = new List<string>();

                // Checkbox column (GUID)

                dataRow.Add(row["GUID"]?.ToString());

                foreach (var field in fieldsOrdered)
                {
                    if (field.Type == FieldTypeEnum.Array)
                    {
                        dataRow.Add((string)row.RenderValue(field, form));
                    }
                    else
                    {
                        dataRow.Add((string)row.RenderValue(field));
                    }
                }

                if ((app.Custom != null && !app.Custom.OpenViewer) || !showViewer)
                {
                    dataRow.Add("0");
                }
                else
                {
                    if (row.ContainsKey("ODISS_SHOWVIEWER"))
                    {
                        dataRow.Add((bool)row["ODISS_SHOWVIEWER"] ? "1" : "0");
                    }
                    else
                    {
                        dataRow.Add("1");
                    }
                }

                if (row.ContainsKey("HasNotes") && showNotes)
                {
                    dataRow.Add((bool)row.GetValue("HasNotes") ? "1" : "0");
                }
                else
                {
                    dataRow.Add("0");
                }

                if (row.ContainsKey("SubmittedBy") && row["SubmittedBy"] != null)
                {
                    dataRow.Add((string)row["SubmittedBy"]);
                }
                else
                {
                    dataRow.Add(string.Empty);
                }

                dataTableResults.Add(dataRow);
            }

            return dataTableResults;
        }

        public dynamic SearchAutoComplete(string query, App app, string mapTo)
        {
            // If not able to use a search engine then let Odiss Library handle it
            dynamic fallbackFunc() { return Documents.SearchAutoComplete(query, app, mapTo); }

            var field = app.Fields.FirstOrDefault(x => x.ID == Guid.Parse(mapTo));

            if (field == null)
            {
                return fallbackFunc();
            }

            var searchObject = GetSearchObject(field);

            if (searchObject == null || !searchObject.ContainsKey("entityName"))
            {
                return fallbackFunc();
            }

            var searchOptions = CreateEntitySearchOptions(searchObject, query, app.ID.ToString().ToLower());

            var results = searchEngine.Search(searchOptions);
            var records = results.Records;

            var selector = GetFilterDataValueText(field);

            if (selector.displayFormat == null && selector.text == null && selector.value == null)
            {
                return fallbackFunc();
            }

            string bindingValue = searchObject.ContainsKey("bindingValue") ? searchObject["bindingValue"].ToString() : null;

            return records.Select(item =>
            {
                string data = ReflectionHelper.GetPropertyStringValue(item, selector.value ?? bindingValue);
                string value = GetAutoCompleteTextForItem(item, selector.text, selector.displayFormat);

                return new
                {
                    value,
                    data
                };
            });
        }

        private static GlobalSearchOptions CreateEntitySearchOptions(JObject searchObject, string query, string applicationId)
        {
            var options = CreateSearchOptions(searchObject, query);

            return new GlobalSearchOptions
            {
                EntityName = searchObject["entityName"].ToString(),
                CallingApplicationIdentifier = applicationId,
                Page = options.Page,
                PageSize = options.PageSize ?? 10,
                SearchParameters = options.SearchParameters,
                Sortings = options.Sortings,
                AdditionalArguments = options.AdditionalArguments
            };
        }

        private static SearchOptions CreateSearchOptions(JObject searchObject, string query)
        {
            var options = new SearchOptions();

            if (searchObject.ContainsKey("page"))
            {
                options.Page = searchObject.Value<int>();
            }

            if (searchObject.ContainsKey("pageSize"))
            {
                options.PageSize = searchObject.Value<int>();
            }

            if (searchObject.ContainsKey("searchFields"))
            {
                options.SearchParameters = new Dictionary<string, object>
                {
                    { searchObject["searchFields"].ToString(), query }
                };
            }

            if (searchObject.ContainsKey("additionalArguments"))
            {
                options.AdditionalArguments = new Dictionary<string, object>();

                var additionalArguments = searchObject["additionalArguments"];

                foreach (JProperty argument in additionalArguments)
                {
                    var fieldName = argument.Name.ToString();
                    var value = GetTokenObjectValue(argument.Value);

                    options.AdditionalArguments.Add(new KeyValuePair<string, object>(argument.Name, value));
                }
            }

            if (searchObject.ContainsKey("sortOrder"))
            {
                options.Sortings = new Dictionary<string, SortOrder>();
                var sortOrder = searchObject["sortOrder"];

                foreach (JProperty sort in sortOrder)
                {
                    var sortOrderString = sort.Value.ToString();
                    var sortOrderEnum = (SortOrder)Enum.Parse(typeof(SortOrder), sortOrderString);

                    options.Sortings.Add(new KeyValuePair<string, SortOrder>(sort.Name, sortOrderEnum));
                }
            }

            return options;
        }

        private static (string value, string text, string displayFormat) GetFilterDataValueText(LibrarySettings.Field field)
        {
            var filterData = JObject.Parse(field.FilterData);

            string value = null;
            string text = null;
            string displayFormat = null;

            if (filterData.ContainsKey("value"))
            {
                value = filterData["value"].ToString();
            }

            if (filterData.ContainsKey("text"))
            {
                text = filterData["text"].ToString();
            }

            if (filterData.ContainsKey("displayFormat"))
            {
                displayFormat = filterData["displayFormat"].ToString();
            }

            return (value, text, displayFormat);
        }

        private static string GetAutoCompleteTextForItem(dynamic item, string text, string displayFormat)
        {
            if (!string.IsNullOrEmpty(text))
            {
                return ReflectionHelper.GetPropertyStringValue(item, text);
            }

            if (!string.IsNullOrEmpty(displayFormat))
            {
                return Regex.Replace(displayFormat, @"\{([^}]*)\}", delegate (Match match)
                {
                    return ReflectionHelper.GetPropertyStringValue(item, match.Groups[1].Value);
                });
            }

            return null;
        }

        private static object GetTokenObjectValue(JToken token)
        {
            // TODO

            if (token.Type == JTokenType.Boolean)
            {
                return token.Value<bool>();
            }
            else if (token.Type == JTokenType.Integer)
            {
                return token.Value<int>();
            }
            else
            {
                return token.ToString();
            }
        }
    }

    internal static class ReflectionHelper
    {
        internal static T GetPropertyValue<T>(object dynamicObject, string propertyName)
        {
            var type = dynamicObject.GetType();
            var valueProperty = type.GetProperties().FirstOrDefault(x => string.Equals(x.Name, propertyName, StringComparison.OrdinalIgnoreCase));

            if (valueProperty == null)
            {
                return default(T);
            }

            return (T)valueProperty.GetValue(dynamicObject, null);
        }

        internal static string GetPropertyStringValue(object dynamicObject, string propertyName)
        {
            var type = dynamicObject.GetType();
            var valueProperty = type.GetProperties().FirstOrDefault(x => string.Equals(x.Name, propertyName, StringComparison.OrdinalIgnoreCase));

            if (valueProperty == null)
            {
                return null;
            }

            var returnValue = valueProperty.GetValue(dynamicObject, null);

            return returnValue.ToString();
        }
    }
}