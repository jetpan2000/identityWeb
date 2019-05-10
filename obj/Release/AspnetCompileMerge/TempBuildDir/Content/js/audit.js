var OdissAudit = {
    statisticsStarted: false,
    language: 'en',
    baseUrl: null,
    systemPagesDescription: '',
    auditShowDescription: '',
    TB: null,
    maxPerPage: 10,
    isExporting: false,
    start: function () {

        //$('#txtRecordedRange span').html(moment().subtract(29, 'days').format('MMM D, YYYY') + ' - ' + moment().format('MMM D, YYYY'));

        moment.locale(OdissAudit.language);

        /*
        // Temporarily disabled
        $('#calendar').fullCalendar({
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,basicWeek,basicDay'
            },
            //defaultDate: '2016-01-12',
            editable: true,
            lang: OdissAudit.language,
            eventLimit: true, // allow "more" link when too many events
            events: function (start, end, timezone, callback) {
                jQuery.ajax({
                    url: './audit/get',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        start: start.format(),
                        end: end.format()
                    },
                    success: function (doc) {
                        var events = [];
                        if (!!doc) {
                            $.map(doc, function (r) {
                                events.push({
                                    //id: r.id,
                                    title: r.title,
                                    start: r.start//,
                                    //end: r.date_end
                                });
                            });
                        }
                        callback(events);
                    }
                });
            }
        });
        */

        $(window).resize(function () {
            // Temporarily disable
            //$('#calendar').fullCalendar('option', 'height', function () { return $(window).height() - 30; });
        });

        $("input[data-type='daterange']").daterangepicker({
            "showWeekNumbers": true,
            ranges: DRPRanges(OdissAudit.language),
            linkedCalendars: false,
            autoUpdateInput: false,
            locale: DRPLocale(OdissAudit.language)
        });

        $('.form-group-date-range').on('apply.daterangepicker', function (ev, picker) {
            $(this).find('input').val(picker.startDate.format(OdissBase.dateFormat) + ' - ' + picker.endDate.format(OdissBase.dateFormat));
        });

        $('.form-group-date-range').on('cancel.daterangepicker', function (ev, picker) {
            $(this).find('input').val('');
        });

        var tree = $("#ulActions");

        tree.jstree({
            "plugins": ["checkbox", "html_data", "wholerow"],
            "core": {
                "themes": {
                    "variant": "small",
                    "responsive": true
                }
            }
        }).on('ready.jstree', function () {
            // 1. Get selected values from input hidden and selected the fields in the tree
            var inputValues = $('#Audit_Actions').val();
            var selectedArray = inputValues.split(',');

            $(this).jstree().select_node(selectedArray);
            // /1

            tree.jstree('open_all');
        });

        var buttons = [{
            autoClose: true,
            extend: 'collection',
            text: DTExport(OdissAudit.language),
            enabled: false,
            buttons: [{
                text: DTCurrentPage(OdissAudit.language),
                action: function () {
                    OdissAudit.doExport(false);
                }
            },
            {
                text: DTAllPages(OdissAudit.language),
                action: function () {
                    OdissAudit.doExport(true);
                }
            }]
        }];

        OdissAudit.TB = $('#tbAudit').DataTable({
            deferLoading: 0,
            conditionalPaging: true,
            autoWidth: true,
            language: DTLocale(OdissAudit.language),
            //dom: 'itBpr',
            dom: '<"pull-left"i><"pull-right divTableButtons"B>tpr', // New
            "initComplete": function (settings, json) {
                $('#tbAudit').show();
                $("#page").val(1); // Set to load the pages. Page = 1
            },
            "aaSorting": [], // Disable automatic order
            buttons: buttons,
            "pageLength": OdissAudit.maxPerPage,

            processing: true,
            serverSide: true,
            fixedHeader: { header: true, headerOffset: OdissAudit.getNavbarHeight() },
            ajax: {
                url: OdissAudit.baseUrl + '/', type: "POST", data: function (d) {
                    if (OdissAudit.TB != null) {
                        var order = OdissAudit.TB.order();
                        if (order != null && order.length > 0) {
                            $("#sort").val(order[0][0] + "," + order[0][1]);
                        }
                    }

                    return $("#frmSearch").serialize();
                }
            },
            columnDefs: [
                {
                    targets: 3, render: function (data, type, row, meta){ // System Pages
                        if (!data)
                        {
                            return '<span style="color:#a7a7a7">' + OdissAudit.systemPagesDescription + '</span>';
                        }

                        return data;
                    }
                },
                {
                    targets: 4, orderable: false, render: function (data, type, row, meta) { // Details link
                        return '<a href class="link-open-details" data-id="' + data + '">' + OdissAudit.auditShowDescription + '</a>';
                    }
                }
            ]
        });

        $("#frmSearch").on('submit', function (e) {
            if (OdissAudit.isExporting) {
                // Do not search while export process is running.
                return false;
            }
            else {
                e.preventDefault();
                $("#Audit_Actions").val($('#ulActions').jstree("get_selected"));
                $("#page").val(1);
                OdissAudit.clearTable();
                OdissAudit.TB.ajax.reload();
                OdissAudit.TB.fixedHeader.enable();

                return false;
            }
        });

        $("#tbAudit").on('page.dt', function () {
            $("#page").val(OdissAudit.TB.page.info().page + 1);
        });

        $("#tbAudit").on('draw.dt', function () {
            OdissAudit.showHideExport();

            /*

            OdissApp.showHideViewAsOneImage();

            if (OdissApp.isSearchResultResponsive) {
                OdissApp.TB.columns.adjust().responsive.recalc();
            }
            */
        });

        $("#tbAudit").on("xhr.dt", function () {
            var xhrResult = OdissAudit.TB.ajax.json();

            if (xhrResult.IsAuthenticated != null && !xhrResult.IsAuthenticated) {
                OdissBase.showDisconnected();
            }
        });

        $("#tbAudit").on('init.dt', function () {
            $(".dataTables_empty").html("");
        });

        $("#tbAudit").on('click', '.link-open-details', function (e) {
            e.stopPropagation();
            e.preventDefault();

            var dataId = $(this).data('id');
            var modal = $("#modShow");

            $.post(OdissAudit.baseUrl + "getdata", { id: dataId }).done(function (data) {
                var dataToShow = "";

                if (data.Data != null)
                {
                    dataToShow = JSONTable.create(data.Data, OdissAudit.language);
                }
                else if (data.Reference != null)
                {
                    dataToShow = JSONTable.create(data.Reference, OdissAudit.language);
                }

                $("#modalDetailsBody").html(dataToShow);
                modal.modal('show');
            });
        });

        $("#btnChart").click(function () {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
            $("#panChart").show();
            $("#panList, #panCalendar").hide();

            if (!OdissAudit.statisticsStarted) {
                OdissAudit.startStatistics();
                OdissAudit.statisticsStarted = true;
            }
        });

        $("#btnList").click(function () {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
            $("#panList").show();
            $("#panChart, #panCalendar").hide();
        });

        $("#btnCalendar").click(function () {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
            $("#panCalendar").show();
            $("#panChart, #panList").hide();
        });
    },
    doExport: function (exportAllPages) {
        if (OdissAudit.isExporting) {
            // Do not export if export process is running.
            return false;
        }

        OdissAudit.isExporting = true;
        $("#exporting").val("1");
        var prevPage = $("#page").val();

        if (exportAllPages)
        {
            $("#page").val("0");
        }

        $.fileDownload(OdissAudit.baseUrl, {
            httpMethod: "POST",
            data: $("#frmSearch").serialize()
        })
        .always(function () {
            $("#exporting").val("");
            OdissAudit.isExporting = false;

            if (exportAllPages) {
                $("#page").val(prevPage);
            }
        });
    },
    showHideExport: function () {
        OdissAudit.TB.button(0).enable(OdissAudit.TB.rows().count() > 0);
    },
    clearTable: function () {
        $("#tbAudit tbody").empty();
        $("#tbAudit_paginate").empty();
        $("#tbAudit_info").text('Loading...');
    },
    getNavbarHeight: function () {
        if ($("#navbar").is(':visible')) {
            return $('#navbar').height();
        }
        else {
            return 0;
        }
    },
    getRandomColor: function () {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },
    startStatistics: function()
    {
        Chart.defaults.global.responsive = true;

        $.post('./audit/GetStatistics', { type: 1 })
            .done(function (data) {
                var ctx = $("#chartStatistics1").get(0).getContext("2d");
                var chart1 = new Chart(ctx, {
                    type: 'line',
                    data: data.Data
                });
            });

        $.post('./audit/GetStatistics', { type: 2 })
            .done(function (data) {
                var ctx = $("#chartStatistics2").get(0).getContext("2d");
                var chart2 = new Chart(ctx, {
                    type: 'doughnut',
                    data: data.Data,
                    animation: {
                        animateRotate: false
                    },
                    options: {
                        legend: {
                            position: 'right'
                        }
                    }
                });
            });
    }
};