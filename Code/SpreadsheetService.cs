using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using Octacom.Odiss.Library;

namespace Octacom.Odiss.ABCgroup.Web.Code
{
    public class SpreadsheetService : IDisposable
    {
        public MemoryStream SpreadsheetStream { get; set; } // The stream that the spreadsheet gets returned on
        private Worksheet currentWorkSheet => spreadSheet.WorkbookPart.WorksheetParts.First().Worksheet;
        private SpreadsheetDocument spreadSheet;
        private Columns _cols;

        /// <summary>
        /// Create a basic spreadsheet template
        /// The structure of OpenXML spreadsheet is something like this from what I can tell:
        ///                        Spreadsheet
        ///                              |
        ///                         WorkbookPart
        ///                   /         |             \
        ///           Workbook WorkbookStylesPart WorksheetPart
        ///                 |          |               |
        ///            Sheets     StyleSheet        Worksheet
        ///                |                        /        \
        ///          (refers to               SheetData        Columns
        ///           Worksheetparts)            |
        ///                                     Rows
        ///
        /// Obviously this only covers the bits in this class!
        /// </summary>
        /// <returns></returns>
        public bool CreateSpreadsheet()
        {
            try
            {
                SpreadsheetStream = new MemoryStream();

                // Create the spreadsheet on the MemoryStream
                spreadSheet = SpreadsheetDocument.Create(SpreadsheetStream, SpreadsheetDocumentType.Workbook);

                WorkbookPart wbp = spreadSheet.AddWorkbookPart();   // Add workbook part
                WorksheetPart wsp = wbp.AddNewPart<WorksheetPart>(); // Add worksheet part
                Workbook wb = new Workbook(); // Workbook
                FileVersion fv = new FileVersion
                {
                    ApplicationName = "App Name"
                };
                Worksheet ws = new Worksheet(); // Worksheet
                SheetData sd = new SheetData(); // Data on worksheet

                // Add stylesheet
                WorkbookStylesPart stylesPart = spreadSheet.WorkbookPart.AddNewPart<WorkbookStylesPart>();
                stylesPart.Stylesheet = GenerateStyleSheet();
                stylesPart.Stylesheet.Save();


                _cols = new Columns(); // Created to allow bespoke width columns

                ws.Append(sd); // Add sheet data to worksheet
                wsp.Worksheet = ws; // Add the worksheet to the worksheet part
                wsp.Worksheet.Save();
                // Define the sheets that the workbooks has in it.

                Sheets sheets = new Sheets();
                Sheet sheet = new Sheet
                {
                    Name = "Sheet 1",
                    SheetId = 1, // Only one sheet per spreadsheet in this class so call it sheet 1
                    Id = wbp.GetIdOfPart(wsp) // ID of sheet comes from worksheet part
                };

                sheets.Append(sheet);
                wb.Append(fv);
                wb.Append(sheets); // Append sheets to workbook

                spreadSheet.WorkbookPart.Workbook = wb;
                spreadSheet.WorkbookPart.Workbook.Save();
            }
            catch (Exception ex)
            {
                ex.Log();
                return false;
            }

            return true;
        }

        public void Save()
        {
            currentWorkSheet.Save();
        }

        /*
        /// <summary>
        /// add the bespoke columns for the list spreadsheet
        /// </summary>
        public void CreateColumnWidth(uint startIndex, uint endIndex, double width)
        {
            // Find the columns in the worksheet and remove them all
            if (currentWorkSheet.Where(x => x.LocalName == "cols").Count() > 0)
                currentWorkSheet.RemoveChild<Columns>(_cols);

            // Create the column
            Column column = new Column();
            column.Min = startIndex;
            column.Max = endIndex;
            column.Width = width;
            column.CustomWidth = true;
            _cols.Append(column); // Add it to the list of columns

            // Make sure that the column info is inserted *before* the sheetdata
            currentWorkSheet.InsertBefore<Columns>(_cols, currentWorkSheet.Where(x => x.LocalName == "sheetData").First());
            currentWorkSheet.Save();
            spreadSheet.WorkbookPart.Workbook.Save();
        }
        */

        /// <summary>
        /// Close the spreadsheet
        /// </summary>
        public void CloseSpreadsheet()
        {
            spreadSheet.Close();
        }

        /// <summary>
        /// Pass a list of column headings to create the header row
        /// </summary>
        /// <param name="headers"></param>
        public void AddHeader(List<string> headers)
        {
            // Find the sheetdata of the worksheet
            SheetData sd = (SheetData)currentWorkSheet.First(x => x.LocalName == "sheetData");
            Row header = new Row
            {
                RowIndex = Convert.ToUInt32(sd.ChildElements.Count()) + 1
            };
            // increment the row index to the next row
            sd.Append(header); // Add the header row

            foreach (string heading in headers)
            {
                AppendCell(header, header.RowIndex, heading, 1);
            }

            // save worksheet
            currentWorkSheet.Save();
        }


        /// <summary>
        /// Pass a list of data items to create a data row
        /// </summary>
        /// <param name="dataItems"></param>
        public void AddRow(ICollection<object> dataItems)
        {
            // Find the sheetdata of the worksheet
            if (CurrentSheetData == null)
                CurrentSheetData = (SheetData)currentWorkSheet.First(x => x.LocalName == "sheetData");

            Row header = new Row();

            if (CurrentRow == default(UInt32Value))
                CurrentRow = Convert.ToUInt32(CurrentSheetData.ChildElements.Count) + 1;

            // increment the row index to the next row
            header.RowIndex = CurrentRow;

            CurrentRow++;

            CurrentSheetData.Append(header);

            foreach (object item in dataItems)
            {
                if (item is decimal)
                {
                    if ((decimal)item < 0)
                    {
                        AppendCell(header, header.RowIndex, Convert.ToString(item), 7);
                        continue;
                    }
                }
                else if (item is double)
                {
                    if ((double)item < 0)
                    {
                        AppendCell(header, header.RowIndex, Convert.ToString(item), 7);
                        continue;
                    }
                }

                AppendCell(header, header.RowIndex, Convert.ToString(item), 0);
            }

            // save worksheet
            //currentWorkSheet.Save();
        }

        private UInt32Value CurrentRow { get; set; }

        private SheetData CurrentSheetData { get; set; }

        /// <summary>
        /// Add cell into the passed row.
        /// </summary>
        /// <param name="row"></param>
        /// <param name="rowIndex"></param>
        /// <param name="value"></param>
        /// <param name="styleIndex"></param>
        private void AppendCell(Row row, uint rowIndex, string value, uint styleIndex)
        {
            Cell cell = new Cell
            {
                DataType = CellValues.InlineString,
                StyleIndex = styleIndex // Style index comes from stylesheet generated in GenerateStyleSheet()
            };

            Text t = new Text
            {
                Text = value
            };

            // Append Text to InlineString object
            InlineString inlineString = new InlineString();
            inlineString.AppendChild(t);

            // Append InlineString to Cell
            cell.AppendChild(inlineString);

            // Get the last cell's column
            string nextCol = "A";
            Cell c = (Cell)row.LastChild;
            if (c != null) // if there are some cells already there...
            {
                int numIndex = c.CellReference.ToString().IndexOfAny(new[] { '1', '2', '3', '4', '5', '6', '7', '8', '9' });

                // Get the last column reference
                string lastCol = c.CellReference.ToString().Substring(0, numIndex);
                // Increment
                nextCol = IncrementColRef(lastCol);
            }

            cell.CellReference = nextCol + rowIndex;

            row.AppendChild(cell);
        }

        private string IncrementColRef(string lastRef)
        {
            char[] characters = lastRef.ToUpperInvariant().ToCharArray();
            int sum = 0;
            foreach (char t in characters)
            {
                sum *= 26;
                sum += (t - 'A' + 1);
            }

            sum++;

            string columnName = string.Empty;
            int modulo;

            while (sum > 0)
            {
                modulo = (sum - 1) % 26;
                columnName = Convert.ToChar(65 + modulo).ToString() + columnName;
                sum = (int)((sum - modulo) / 26);
            }

            return columnName;
        }

        private Stylesheet GenerateStyleSheet()
        {
            return new Stylesheet(
                new Fonts(
                    new Font(                                                               // Index 0 - The default font.
                        new FontSize() { Val = 11 },
                        new Color() { Rgb = new HexBinaryValue() { Value = "000000" } },
                        new FontName() { Val = "Calibri" }),
                    new Font(                                                               // Index 1 - The bold font.
                        new Bold(),
                        new FontSize() { Val = 11 },
                        new Color() { Rgb = new HexBinaryValue() { Value = "000000" } },
                        new FontName() { Val = "Calibri" }),
                    new Font(                                                               // Index 2 - The Italic font.
                        new Italic(),
                        new FontSize() { Val = 11 },
                        new Color() { Rgb = new HexBinaryValue() { Value = "000000" } },
                        new FontName() { Val = "Calibri" }),
                    new Font(                                                               // Index 3 - The Times Roman font. with 16 size
                        new FontSize() { Val = 16 },
                        new Color() { Rgb = new HexBinaryValue() { Value = "000000" } },
                        new FontName() { Val = "Times New Roman" }),
                    new Font(                                                               // Index 4 - Red color
                        new FontSize() { Val = 11 },
                        new Color() { Rgb = new HexBinaryValue() { Value = "FF0000" } },
                        new FontName() { Val = "Calibri" })
                ),
                new Fills(
                    new Fill(                                                           // Index 0 - The default fill.
                        new PatternFill() { PatternType = PatternValues.None }),
                    new Fill(                                                           // Index 1 - The default fill of gray 125 (required)
                        new PatternFill() { PatternType = PatternValues.Gray125 }),
                    new Fill(                                                           // Index 2 - The yellow fill.
                        new PatternFill(
                            new ForegroundColor() { Rgb = new HexBinaryValue() { Value = "FFFFFF00" } }
                        )
                        { PatternType = PatternValues.Solid })
                ),
                new Borders(
                    new Border(                                                         // Index 0 - The default border.
                        new LeftBorder(),
                        new RightBorder(),
                        new TopBorder(),
                        new BottomBorder(),
                        new DiagonalBorder()),
                    new Border(                                                         // Index 1 - Applies a Left, Right, Top, Bottom border to a cell
                        new LeftBorder(
                            new Color() { Auto = true }
                        )
                        { Style = BorderStyleValues.Thin },
                        new RightBorder(
                            new Color() { Auto = true }
                        )
                        { Style = BorderStyleValues.Thin },
                        new TopBorder(
                            new Color() { Auto = true }
                        )
                        { Style = BorderStyleValues.Thin },
                        new BottomBorder(
                            new Color() { Auto = true }
                        )
                        { Style = BorderStyleValues.Thin },
                        new DiagonalBorder())
                ),
                new CellFormats(
                    new CellFormat() { FontId = 0, FillId = 0, BorderId = 0 },                         // Index 0 - The default cell style.  If a cell does not have a style index applied it will use this style combination instead
                    new CellFormat() { FontId = 1, FillId = 0, BorderId = 0, ApplyFont = true },       // Index 1 - Bold
                    new CellFormat() { FontId = 2, FillId = 0, BorderId = 0, ApplyFont = true },       // Index 2 - Italic
                    new CellFormat() { FontId = 3, FillId = 0, BorderId = 0, ApplyFont = true },       // Index 3 - Times Roman
                    new CellFormat() { FontId = 0, FillId = 2, BorderId = 0, ApplyFill = true },       // Index 4 - Yellow Fill
                    new CellFormat(                                                                    // Index 5 - Alignment
                        new Alignment() { Horizontal = HorizontalAlignmentValues.Center, Vertical = VerticalAlignmentValues.Center }
                    )
                    { FontId = 0, FillId = 0, BorderId = 0, ApplyAlignment = true },
                    new CellFormat() { FontId = 0, FillId = 0, BorderId = 1, ApplyBorder = true },      // Index 6 - Border
                    new CellFormat() { FontId = 4, FillId = 0, BorderId = 0, ApplyFont = true }         // Index 7 - Red color
                )
            ); // return
        }

        public void Dispose()
        {
            spreadSheet?.Dispose();
            SpreadsheetStream?.Dispose();
        }
    }
}