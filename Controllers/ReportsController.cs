using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using Octacom.Odiss.Library;
using Octacom.Odiss.Library.Config;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Mime;
using System.Text;
using System.Web;
using System.Web.Mvc;
using Octacom.Odiss.Library.Models;
using Octacom.Odiss.ABCgroup.Web.Globalization;
using System.Text.RegularExpressions;

namespace Octacom.Odiss.ABCgroup.Web.Controllers
{
    [Authorize]
    public class ReportsController : Octacom.Odiss.Core.Identity.Bootstrap.Odiss5.Mvc.BaseController
    {
        [Menu(MenuEnum.Reports)]
        public ActionResult Index(FormCollection model)
        {
            ReportsIndex ri = new ReportsIndex
            {
                FormState = model,
                AvailableReports = Reports.GetAvailable()
            };

            return View(ri);
        }

        #region Ajax Requests

        private static string GetColumnName(int columnIndex)
        {
            int dividend = columnIndex;
            string columnName = string.Empty;
            int modifier;

            while (dividend > 0)
            {
                modifier = (dividend - 1) % 26;
                columnName = Convert.ToChar(65 + modifier).ToString() + columnName;
                dividend = (int)((dividend - modifier) / 26);
            }

            return columnName;
        }

        public ActionResult Search(FormCollection model)
        {
            string selectedReport = model["cboReports"];
            string datePeriod = model["DatePeriod"];

            if (selectedReport.HasValue())
            {
                Guid idReport = new Guid(selectedReport);
                Reports report = Reports.Get(idReport);

                IEnumerable<dynamic> data = Reports.Run(report, datePeriod);

                HttpContext.Response.SetCookie(new HttpCookie("fileDownload", "true") { Path = "/" });

                var context = HttpContext.Response;
                context.Buffer = context.BufferOutput = false;
                context.Cache.SetCacheability(HttpCacheability.Private);
                context.Cache.SetExpires(DateTime.Now);
                //context.ContentType = (new ContentType("text/csv") { CharSet = "utf-8" }).ToString(); // CSV
                //context.ContentType = (new ContentType("application/vnd.ms-excel") { CharSet = "utf-8" }).ToString();
                context.ContentType = new ContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") { CharSet = "utf-8" }.ToString();
                context.AppendHeader("Content-Disposition",
                    new ContentDisposition
                    {
                        DispositionType = DispositionTypeNames.Attachment,
                        FileName = string.Format(CultureInfo.InvariantCulture, report.FileNamePrefix + "_{0:yyyyMMdd_HHmmss}.xlsx", DateTime.Now)
                    }.ToString()
                );
                context.AppendHeader("X-Content-Type-Options", "nosniff");

                using (MemoryStream mDocument = new MemoryStream())
                {
                    // Using SAX
                    using (SpreadsheetDocument document = SpreadsheetDocument.Create(mDocument, SpreadsheetDocumentType.Workbook))
                    {
                        List<OpenXmlAttribute> attributes;

                        document.AddWorkbookPart();

                        // Stylesheet
                        WorkbookStylesPart stylesheet = document.WorkbookPart.AddNewPart<WorkbookStylesPart>();

                        stylesheet.Stylesheet = new Stylesheet(new Fonts(
                                new Font( // 0 = Default
                                    new Color() { Rgb = new HexBinaryValue() { Value = "000000" } }
                                ),
                                new Font( // 1 = Bold
                                    new Bold()
                                    ),
                                new Font( // 2 = Red
                                    new Color() { Rgb = new HexBinaryValue() { Value = "FF0000" } }
                                    )
                            ),
                            new Fills(
                                new Fill() { }
                                ),
                            new Borders(new Border() { }),
                            new CellFormats(
                                new CellFormat() { FontId = 0 }, // 0
                                new CellFormat() { FontId = 1, ApplyFont = true }, // 1
                                new CellFormat() { FontId = 2, ApplyFont = true } // 2
                                )
                            );
                        stylesheet.Stylesheet.Save();

                        WorksheetPart workSheetPart = document.WorkbookPart.AddNewPart<WorksheetPart>();

                        OpenXmlWriter writer = OpenXmlWriter.Create(workSheetPart);
                        writer.WriteStartElement(new Worksheet());
                        writer.WriteStartElement(new SheetData());

                        IDictionary<string, object> firstRow = data.FirstOrDefault();

                        if (firstRow != null)
                        {
                            int row = 1;

                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("r", null, row.ToString())
                            };
                            writer.WriteStartElement(new Row(), attributes);

                            int col1 = 1;
                            foreach (var cols in firstRow.Keys.ToList())
                            {
                                attributes = new List<OpenXmlAttribute>
                                {
                                    new OpenXmlAttribute("t", null, "str"),
                                    new OpenXmlAttribute("r", "", GetColumnName(col1) + row),
                                    new OpenXmlAttribute("s", "", "1") // Bold (Style 1)
                                };

                                writer.WriteStartElement(new Cell(), attributes);
                                writer.WriteElement(new CellValue(cols));
                                writer.WriteEndElement();

                                col1++;
                            }

                            writer.WriteEndElement();

                            row++;

                            foreach (IDictionary<string, object> row2 in data)
                            {
                                attributes =
                                    new List<OpenXmlAttribute>
                                    {
                                        new OpenXmlAttribute("r", null, row.ToString())
                                    };
                                writer.WriteStartElement(new Row(), attributes);

                                int col = 1;

                                foreach (var key in row2.Keys)
                                {
                                    attributes = new List<OpenXmlAttribute>
                                    {
                                        new OpenXmlAttribute("t", null, "str"),
                                        new OpenXmlAttribute("r", "", GetColumnName(col) + row)
                                    };

                                    if (row2[key] is decimal)
                                    {
                                        if ((decimal)row2[key] < 0)
                                        {
                                            attributes.Add(new OpenXmlAttribute("s", "", "2")); // Red (Style 2)
                                        }
                                    }
                                    else if (row2[key] is double)
                                    {
                                        if ((double)row2[key] < 0)
                                        {
                                            attributes.Add(new OpenXmlAttribute("s", "", "2")); // Red (Style 2)
                                        }
                                    }

                                    writer.WriteStartElement(new Cell(), attributes);
                                    writer.WriteElement(new CellValue(row2[key] != null ? row2[key].ToString() : ""));
                                    writer.WriteEndElement();

                                    col++;
                                }

                                writer.WriteEndElement();

                                row++;
                            }
                        }
                        else
                        {
                            // Empty row (no data found)
                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("r", null, "1")
                            };
                            writer.WriteStartElement(new Row(), attributes);

                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("t", null, "str"),
                                new OpenXmlAttribute("r", "", GetColumnName(1) + 1),
                                new OpenXmlAttribute("s", "", "1") // Bold (Style 1)
                            };

                            writer.WriteStartElement(new Cell(), attributes);
                            writer.WriteElement(new CellValue(""));
                            writer.WriteEndElement();

                            writer.WriteEndElement();
                        }

                        writer.WriteEndElement();
                        writer.WriteEndElement();
                        writer.Close();

                        writer = OpenXmlWriter.Create(document.WorkbookPart);
                        writer.WriteStartElement(new Workbook());
                        writer.WriteStartElement(new Sheets());

                        writer.WriteElement(new Sheet()
                        {
                            Name = "Sheet 1",
                            SheetId = 1,
                            Id = document.WorkbookPart.GetIdOfPart(workSheetPart)
                        });

                        writer.WriteEndElement();
                        writer.WriteEndElement();

                        writer.Close();
                        document.Save();

                        document.Close();

                        mDocument.WriteTo(context.OutputStream);
                    }
                }

                return null;
            }

            return null;
        }

        public JsonResult SearchAutoComplete(string query, string appid, Guid reportID, string parameterName)
        {
            try
            {
                Guid AppGuid = Guid.Parse(appid.TrimEnd('/').Substring(appid.IndexOf(@"app/") + 4));

                var apConfig = ConfigBase.Settings.Applications.SelectForLoggedUser(User, AppGuid);

                if (apConfig == null)
                {
                    return null;
                }

                App app = new App()
                {
                    ID = AppGuid,
                    Name = apConfig.Name.ToLanguage(),
                    Fields = apConfig.Fields,
                    Config = apConfig
                };

                return Json(new
                {
                    query = query,
                    suggestions = Reports.SearchAutoComplete(query, app, reportID, parameterName)
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                ex.Log();
            }

            return Json(new { }, JsonRequestBehavior.AllowGet);
        }

        public static string RemoveInvalidFilePathCharacters(string filename)
        {
            string regexSearch = new string(Path.GetInvalidFileNameChars()) + new string(Path.GetInvalidPathChars());
            Regex r = new Regex(string.Format("[{0}]", Regex.Escape(regexSearch)));
            return r.Replace(filename, string.Empty);
        }

        /*
         report.GetReportData()
             */

        public ActionResult Export(Reports report)
        {
            try
            {
                var reportData = report.GetReportData(true);

                HttpContext.Response.SetCookie(new HttpCookie("fileDownload", "true") { Path = "/" });

                var context = HttpContext.Response;
                context.Buffer = context.BufferOutput = false;
                context.Cache.SetCacheability(HttpCacheability.Private);
                context.Cache.SetExpires(DateTime.Now);
                context.ContentType = new ContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") { CharSet = "utf-8" }.ToString();
                context.AppendHeader("Content-Disposition",
                    new ContentDisposition
                    {
                        DispositionType = DispositionTypeNames.Attachment,
                        FileName = string.Format(CultureInfo.InvariantCulture, RemoveInvalidFilePathCharacters(reportData.title) + "_{0:yyyyMMdd_HHmmss}.xlsx", DateTime.Now)
                    }.ToString()
                );
                context.AppendHeader("X-Content-Type-Options", "nosniff");

                using (MemoryStream mDocument = new MemoryStream())
                {
                    // Using SAX
                    using (SpreadsheetDocument document = SpreadsheetDocument.Create(mDocument, SpreadsheetDocumentType.Workbook))
                    {
                        List<OpenXmlAttribute> attributes;

                        document.AddWorkbookPart();

                        // Stylesheet
                        WorkbookStylesPart stylesheet = document.WorkbookPart.AddNewPart<WorkbookStylesPart>();

                        stylesheet.Stylesheet = new Stylesheet(new Fonts(
                                new Font(new Color() { Rgb = new HexBinaryValue() { Value = "000000" } }), // 0
                                new Font(new Bold()), // 1
                                new Font(new Color() { Rgb = new HexBinaryValue() { Value = "FF0000" } }) // 2
                            ),
                            new Fills(new Fill() { }),
                            new Borders(new Border() { }),
                            new CellFormats(
                                new CellFormat() { FontId = 0 }, // 0
                                new CellFormat() { FontId = 1, ApplyFont = true }, // 1
                                new CellFormat() { FontId = 2, ApplyFont = true } // 2
                                )
                            );
                        stylesheet.Stylesheet.Save();

                        WorksheetPart workSheetPart = document.WorkbookPart.AddNewPart<WorksheetPart>();

                        OpenXmlWriter writer = OpenXmlWriter.Create(workSheetPart);
                        writer.WriteStartElement(new Worksheet());
                        writer.WriteStartElement(new SheetData());

                        IDictionary<string, object> firstRow = new Dictionary<string, object>() {
                            { Words.Reports_Name, "" },
                            { Words.Reports_Value, "" }
                        };

                        if (firstRow != null)
                        {
                            int row = 1;

                            AddLine(writer, row, new string[] { reportData.title }); row++;
                            AddLine(writer, row, new string[] { "" }); row++;

                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("r", null, row.ToString())
                            };
                            writer.WriteStartElement(new Row(), attributes);

                            int col1 = 1;
                            foreach (var cols in firstRow.Keys.ToList())
                            {
                                attributes = new List<OpenXmlAttribute>
                                {
                                    new OpenXmlAttribute("t", null, "str"),
                                    new OpenXmlAttribute("r", "", GetColumnName(col1) + row),
                                    new OpenXmlAttribute("s", "", "1") // Bold (Style 1)
                                };

                                writer.WriteStartElement(new Cell(), attributes);
                                writer.WriteElement(new CellValue(cols));
                                writer.WriteEndElement();

                                col1++;
                            }

                            writer.WriteEndElement();

                            row++;

                            for (int i = 0; i < reportData.labels.Length; i++)
                            {
                                attributes =
                                    new List<OpenXmlAttribute>
                                    {
                                        new OpenXmlAttribute("r", null, row.ToString())
                                    };
                                writer.WriteStartElement(new Row(), attributes);

                                int col = 1;

                                var row2 = new Dictionary<string, object>() {
                                    { "Name", reportData.labels[i] },
                                    { "Value" , reportData.datasets[0].data[i] }
                                };

                                foreach (var key in row2.Keys)
                                {
                                    attributes = new List<OpenXmlAttribute>
                                    {
                                        new OpenXmlAttribute("t", null, "str"),
                                        new OpenXmlAttribute("r", "", GetColumnName(col) + row)
                                    };

                                    if (row2[key] is decimal)
                                    {
                                        if ((decimal)row2[key] < 0)
                                        {
                                            attributes.Add(new OpenXmlAttribute("s", "", "2")); // Red (Style 2)
                                        }
                                    }
                                    else if (row2[key] is double)
                                    {
                                        if ((double)row2[key] < 0)
                                        {
                                            attributes.Add(new OpenXmlAttribute("s", "", "2")); // Red (Style 2)
                                        }
                                    }

                                    writer.WriteStartElement(new Cell(), attributes);
                                    writer.WriteElement(new CellValue(row2[key] != null ? row2[key].ToString() : ""));
                                    writer.WriteEndElement();

                                    col++;
                                }

                                writer.WriteEndElement();

                                row++;
                            }
                        }
                        else
                        {
                            // Empty row (no data found)
                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("r", null, "1")
                            };
                            writer.WriteStartElement(new Row(), attributes);

                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("t", null, "str"),
                                new OpenXmlAttribute("r", "", GetColumnName(1) + 1),
                                new OpenXmlAttribute("s", "", "1") // Bold (Style 1)
                            };

                            writer.WriteStartElement(new Cell(), attributes);
                            writer.WriteElement(new CellValue(""));
                            writer.WriteEndElement();

                            writer.WriteEndElement();
                        }

                        writer.WriteEndElement();
                        writer.WriteEndElement();
                        writer.Close();

                        writer = OpenXmlWriter.Create(document.WorkbookPart);
                        writer.WriteStartElement(new Workbook());
                        writer.WriteStartElement(new Sheets());

                        writer.WriteElement(new Sheet()
                        {
                            Name = "Sheet 1",
                            SheetId = 1,
                            Id = document.WorkbookPart.GetIdOfPart(workSheetPart)
                        });

                        writer.WriteEndElement();
                        writer.WriteEndElement();

                        writer.Close();
                        document.Save();

                        document.Close();

                        mDocument.WriteTo(context.OutputStream);
                    }
                }
            }
            catch (Exception ex)
            {
                ex.Log();
            }

            return null;
        }

        /* Temporarly disabled
        public ActionResult Export(ReportData reportData)
        {
            try
            {
                HttpContext.Response.SetCookie(new HttpCookie("fileDownload", "true") { Path = "/" });

                var context = HttpContext.Response;
                context.Buffer = context.BufferOutput = false;
                context.Cache.SetCacheability(HttpCacheability.Private);
                context.Cache.SetExpires(DateTime.Now);
                context.ContentType = new ContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") { CharSet = "utf-8" }.ToString();
                context.AppendHeader("Content-Disposition",
                    new ContentDisposition
                    {
                        DispositionType = DispositionTypeNames.Attachment,
                        FileName = string.Format(CultureInfo.InvariantCulture, RemoveInvalidFilePathCharacters(reportData.title) + "_{0:yyyyMMdd_HHmmss}.xlsx", DateTime.Now)
                    }.ToString()
                );
                context.AppendHeader("X-Content-Type-Options", "nosniff");

                using (MemoryStream mDocument = new MemoryStream())
                {
                    // Using SAX
                    using (SpreadsheetDocument document = SpreadsheetDocument.Create(mDocument, SpreadsheetDocumentType.Workbook))
                    {
                        List<OpenXmlAttribute> attributes;

                        document.AddWorkbookPart();

                        // Stylesheet
                        WorkbookStylesPart stylesheet = document.WorkbookPart.AddNewPart<WorkbookStylesPart>();

                        stylesheet.Stylesheet = new Stylesheet(new Fonts(
                                new Font(new Color() { Rgb = new HexBinaryValue() { Value = "000000" } }), // 0
                                new Font(new Bold()), // 1
                                new Font(new Color() { Rgb = new HexBinaryValue() { Value = "FF0000" } }) // 2
                            ),
                            new Fills(new Fill() { }),
                            new Borders(new Border() { }),
                            new CellFormats(
                                new CellFormat() { FontId = 0 }, // 0
                                new CellFormat() { FontId = 1, ApplyFont = true }, // 1
                                new CellFormat() { FontId = 2, ApplyFont = true } // 2
                                )
                            );
                        stylesheet.Stylesheet.Save();

                        WorksheetPart workSheetPart = document.WorkbookPart.AddNewPart<WorksheetPart>();

                        OpenXmlWriter writer = OpenXmlWriter.Create(workSheetPart);
                        writer.WriteStartElement(new Worksheet());
                        writer.WriteStartElement(new SheetData());

                        IDictionary<string, object> firstRow = new Dictionary<string, object>() {
                            { Words.Reports_Name, "" },
                            { Words.Reports_Value, "" }
                        };

                        if (firstRow != null)
                        {
                            int row = 1;

                            AddLine(writer, row, new string[] { reportData.title }); row++;
                            AddLine(writer, row, new string[] { "" }); row++;

                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("r", null, row.ToString())
                            };
                            writer.WriteStartElement(new Row(), attributes);

                            int col1 = 1;
                            foreach (var cols in firstRow.Keys.ToList())
                            {
                                attributes = new List<OpenXmlAttribute>
                                {
                                    new OpenXmlAttribute("t", null, "str"),
                                    new OpenXmlAttribute("r", "", GetColumnName(col1) + row),
                                    new OpenXmlAttribute("s", "", "1") // Bold (Style 1)
                                };

                                writer.WriteStartElement(new Cell(), attributes);
                                writer.WriteElement(new CellValue(cols));
                                writer.WriteEndElement();

                                col1++;
                            }

                            writer.WriteEndElement();

                            row++;

                            for (int i = 0; i < reportData.labels.Length; i++)
                            {
                                attributes =
                                    new List<OpenXmlAttribute>
                                    {
                                        new OpenXmlAttribute("r", null, row.ToString())
                                    };
                                writer.WriteStartElement(new Row(), attributes);

                                int col = 1;

                                var row2 = new Dictionary<string, object>() {
                                    { "Name", reportData.labels[i] },
                                    { "Value" , reportData.datasets[0].data[i] }
                                };

                                foreach (var key in row2.Keys)
                                {
                                    attributes = new List<OpenXmlAttribute>
                                    {
                                        new OpenXmlAttribute("t", null, "str"),
                                        new OpenXmlAttribute("r", "", GetColumnName(col) + row)
                                    };

                                    if (row2[key] is decimal)
                                    {
                                        if ((decimal)row2[key] < 0)
                                        {
                                            attributes.Add(new OpenXmlAttribute("s", "", "2")); // Red (Style 2)
                                        }
                                    }
                                    else if (row2[key] is double)
                                    {
                                        if ((double)row2[key] < 0)
                                        {
                                            attributes.Add(new OpenXmlAttribute("s", "", "2")); // Red (Style 2)
                                        }
                                    }

                                    writer.WriteStartElement(new Cell(), attributes);
                                    writer.WriteElement(new CellValue(row2[key] != null ? row2[key].ToString() : ""));
                                    writer.WriteEndElement();

                                    col++;
                                }

                                writer.WriteEndElement();

                                row++;
                            }
                        }
                        else
                        {
                            // Empty row (no data found)
                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("r", null, "1")
                            };
                            writer.WriteStartElement(new Row(), attributes);

                            attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("t", null, "str"),
                                new OpenXmlAttribute("r", "", GetColumnName(1) + 1),
                                new OpenXmlAttribute("s", "", "1") // Bold (Style 1)
                            };

                            writer.WriteStartElement(new Cell(), attributes);
                            writer.WriteElement(new CellValue(""));
                            writer.WriteEndElement();

                            writer.WriteEndElement();
                        }

                        writer.WriteEndElement();
                        writer.WriteEndElement();
                        writer.Close();

                        writer = OpenXmlWriter.Create(document.WorkbookPart);
                        writer.WriteStartElement(new Workbook());
                        writer.WriteStartElement(new Sheets());

                        writer.WriteElement(new Sheet()
                        {
                            Name = "Sheet 1",
                            SheetId = 1,
                            Id = document.WorkbookPart.GetIdOfPart(workSheetPart)
                        });

                        writer.WriteEndElement();
                        writer.WriteEndElement();

                        writer.Close();
                        document.Save();

                        document.Close();

                        mDocument.WriteTo(context.OutputStream);
                    }
                }
            }
            catch (Exception ex)
            {
                ex.Log();
            }

            return null;
        }
        */

        [ChildActionOnly]
        public static void AddLine(OpenXmlWriter writer, int row, string[] values)
        {
            List<OpenXmlAttribute> attributes = new List<OpenXmlAttribute>
                            {
                                new OpenXmlAttribute("r", null, row.ToString())
                            };
            writer.WriteStartElement(new Row(), attributes);

            int col1 = 1;
            foreach (var cols in values)
            {
                attributes = new List<OpenXmlAttribute>
                                {
                                    new OpenXmlAttribute("t", null, "str"),
                                    new OpenXmlAttribute("r", "", GetColumnName(col1) + row),
                                    new OpenXmlAttribute("s", "", "1") // Bold (Style 1)
                                };

                writer.WriteStartElement(new Cell(), attributes);
                writer.WriteElement(new CellValue(cols));
                writer.WriteEndElement();

                col1++;
            }

            writer.WriteEndElement();
        }

        [HttpGet]
        public JsonResult Charts()
        {
            return Json(Reports.GetAvailable()
                .Where(a => a.Type == ReportType.Chart)
                .Select(a => new { ID = a.ID, IDApplication = a.IDApplication, Type = a.Type })
                .ToArray(), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult Data(Reports report)
        {
            return Json(report.GetReportData());
        }

        #endregion

        protected override JsonResult Json(object data, string contentType, Encoding contentEncoding, JsonRequestBehavior behavior)
        {
            return new JsonNetResult(data, contentType, contentEncoding, behavior);
        }
    }
}