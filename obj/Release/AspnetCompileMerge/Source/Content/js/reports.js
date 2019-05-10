var OdissReports = {
    statisticsStarted: false,
    language: "en",
    currentReports: [],
    allReports:[],
    baseUrl: null,
    baseAppUrl: null,
    start: function () {
        //OdissReports.baseAppUrl += OdissReports.getSelectedApplication();

        moment.locale(OdissReports.language);

        $(".form-group-date-range").daterangepicker({
            "showWeekNumbers": true,
            ranges: DRPRanges(OdissReports.language),
            linkedCalendars: false,
            autoUpdateInput: false,
            locale: DRPLocale(OdissReports.language)
        });

        $(".form-group-date-range").on("apply.daterangepicker", function (ev, picker) {
            $(this).find("input").val(picker.startDate.format(OdissBase.dateFormat) + " - " + picker.endDate.format(OdissBase.dateFormat));
        });

        $(".form-group-date-range").on("cancel.daterangepicker", function (ev, picker) {
            $(this).find("input").val("");
        });

        $(".autocompletesearch").each(function (i) {
            var that = this;

            $("#" + that.id).autocomplete({
                showNoSuggestionNotice: true,
                serviceUrl: OdissReports.baseUrl + "/SearchAutoComplete",
                noCache: true,
                deferRequestBy: 500,
                //params: { appid: OdissReports.baseAppUrl + OdissReports.getSelectedApplication(), reportid: $(that).data("report-id"), parameterName: $(that).data("parameter-name") },
                params: OdissReports.getReportParams($(that).data("parameter-name"), $(that).data("report-id")),
                onSelect: function (suggestion) {
                    var hiddenElement = "hidden" + this.id;
                    $("#" + hiddenElement).val(suggestion.data);
                }
            });

            $("#" + that.id).on("input", function () {
                $("#FILTER_hidden" + that.id).val("");
            });
        });

        $("#graphicalReports").on("click", "[data-type='export']", function () {
            var reportId = $(this).data("report-id");
            var reportData = OdissReports.getReportObj(reportId);
            var currentBtn = $(this);

            if (reportData) {
                $(currentBtn).button("loading");

                var objToSend = OdissReports.getReportObjData(reportData.id);

                $.fileDownload(OdissReports.baseUrl + "/export", {
                    httpMethod: "POST",
                    data: objToSend //reportData.data
                })
                .always(function () {
                    $(currentBtn).button("reset");
                });
            }
            else {
                //TODO: Error creating the report
            }
        });

        $("#frmFilters").on("submit", function (e) {
            e.preventDefault();

            var currentForm = $(this);

            var reportsID =[];

            $(currentForm).find("[name^='FILTER_']").each(function () {
                var currentField = $(this);
                reportsID = $(currentField).data("reports").split(",").concat(reportsID);
            });

            reportsID = $.unique(reportsID);

            if (reportsID.length > 0)
            {
                $.each(reportsID, function (idindex, idvalue) {
                    var reportObj = OdissReports.getReportObj(idvalue);

                    if (reportObj != null) {
                        reportObj.loader.show();
                        reportObj.chart.destroy();

                        var objToSend = OdissReports.getReportObjData(reportObj.id);

                        $.post(OdissReports.baseUrl + "/data", objToSend)
                            .done(function (report) {

                                // Allow export only if has data
                                if (report.hasData) {
                                    reportObj.exportButton.show();
                                } else {
                                    reportObj.exportButton.hide();
                                }

                                var reportData = jQuery.extend(true, { }, report);

                                var allConfig = OdissReports.getReportConfig(report);

                                reportObj.data = reportData;
                                reportObj.chart = new Chart(document.getElementById(reportObj.chartid), allConfig);
                                reportObj.loader.hide();
                        });
                    }
                });
            }
        });

        $("#frmDocuments").on("submit", function (e) {
            e.preventDefault();

            //$("#btnExport").attr("disabled", "disabled");
            //$("#btnExport").next().show();

            var $btn = $("#btnExport").button("loading");

            $.fileDownload(OdissReports.baseUrl + "/search", {
                httpMethod: "POST",
                    data: $(this).serialize()
            })
            .always(function () {
                $btn.button("reset");
                //$("#btnExport").removeAttr("disabled");
            //$("#btnExport").next().hide();
        });

            /*
            $.post(OdissReports.baseUrl + "/search", $(this).serialize())
                .done(function (data) {

                });
            */
        });

        $("a[data-type='application']").on("click", function () {
            OdissReports.changeApplication($(this).data("id"));
        });

        $.get(OdissReports.baseUrl + "/charts")
            .done(function (reports) {
                OdissReports.allReports = reports;

                $("a[data-type='application']:first").trigger("click");
            });
    },
    getReportObjData: function (id) {
        var objToSend = { ID: id, Type: 2 }; // Chart

        $.each($("#frmFilters").find("[name^='FILTER_']"), function (index, formField) {
            objToSend[formField.id]= $(formField).val();
        });

        $.each($("#frmFilters").find("[name^='hiddenFILTER_']"), function (index, formField) {
            objToSend[formField.id] = $(formField).val();
        });

        return objToSend;
    },
    getReportParams: function (paramName, reportId) {
        return { appid: OdissReports.baseAppUrl + OdissReports.getSelectedApplication(), reportid: reportId, parameterName: paramName };
    },
    getSelectedApplication: function () {
        return $("a[data-type='application'][class*='active']").data("id");
    },
    getReportObj: function (id) {
        var objFound = null;

        $.each(OdissReports.currentReports, function (index, obj) {
            if (obj.id == id) {
                objFound = obj;
                return false;
            }
        });

        return objFound;
    },
    getReportConfig: function (report) {
        var allConfig = {
            type: report.type,
            data: {
                labels: report.labels,
                datasets: report.datasets
            },
            options: {
                title: { display: true, text: report.title, fontSize: 18 },
                animation: { duration: 0, onComplete: function () { /*cl.kill();*/ } }
                //     scales: {
                //        yAxes: [{ ticks: { beginAtZero: true } }]
                //    }
            }
        };

        if (report.options != null) {
            for (var key in report.options) allConfig.options[key] = report.options[key];
        }

        return allConfig;
    },
    changeApplication: function (idApplication) {
        $("h1").text("");

        $("a[data-type='application']").removeClass("active");
        $("a[data-type='application'] span").hide();

        var selectedOption = $("a[data-type='application'][data-id='" + idApplication + "']");
        $("a[data-type='application'][data-id='" + idApplication + "'] span").show();

        $(selectedOption).addClass("active");

        $.each(OdissReports.currentReports, function (index, obj) {
            var mainBox = $("#" + obj.chartid).closest(".boxChart");
            //$("#" + obj.chartid).remove();

            mainBox.remove();
        });

        OdissReports.currentReports = [];

        if (idApplication != "") {
            $("h1").text($(selectedOption).text() + " " + $("h1").data("title"));

            var reportsForSelectedApplication = OdissReports.allReports.filter(function (el) {
                return el.IDApplication == idApplication;
            });

            $.each(reportsForSelectedApplication, function (index, value) {

                var reportInternalID = value.ID;
                var reportID = "chart" + index;
                var newobj = $($("#graphTemplate").html());
                newobj.find("canvas").attr("id", reportID);
                var exportButton = newobj.find("[data-type='export']");
                exportButton.data("report-id", reportInternalID);
                $("#graphicalReports").append(newobj);
                var chart = document.getElementById(reportID);
                newobj.find("canvas").parent().attr("id", "L_" + reportID);

                var loader = new CanvasLoader("L_" + reportID, { id: "L2_" + reportID });
                loader.setColor("#84a2fa"); // default is '#000000'
                loader.setDiameter(42); // default is 40
                loader.setDensity(61); // default is 40
                loader.setRange(0.6); // default is 1.3
                loader.setSpeed(3); // default is 2
                loader.setFPS(18); // default is 24
                loader.show(); // Hidden by default

                var objToSend = OdissReports.getReportObjData(reportInternalID);

                $.post(OdissReports.baseUrl + "/data", objToSend)
                    .done(function (report) {

                        var reportData = jQuery.extend(true, {}, report); // Clone object

                        loader.hide();

                        // Allow export only if has data
                        if (report.hasData) {
                            exportButton.show();
                        } else {
                            exportButton.hide();
                        }

                        var allConfig = OdissReports.getReportConfig(report);

                        OdissReports.currentReports.push({ id: reportInternalID, chartid: reportID, chart: new Chart(chart, allConfig), loader: loader, data: reportData, exportButton: exportButton });
                    });
            });
        }
    }
};