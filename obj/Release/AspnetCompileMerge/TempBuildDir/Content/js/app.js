var OdissApp = {
    allowExport: false,
    TB: null,
    baseUrl: null,
    blankUrl: 'about:blank',
    isSearchResultResponsive: true,
    language: 'en',
    groupByPos: '',
    groupByPositions: [],
    refreshEvents: [],
    drawed: false,
    maxPerPage: 10,
    firstVisibleColumn: 1,
    enableSelection: true,
    NotesCache: {},
    TBConfig: {},
    emptyColumn: '',
    isExporting: false,
    fieldEvents: [],
    loadingText: 'Loading...',
    currentPopover: null,
    searchRefreshOnModalClose: false,
    pendingRefreshOnClose: false,
    requiresOneFieldForSearch: false,
    start: function () {
        moment.locale(OdissApp.language);

        var drpLocale = DRPLocale(OdissApp.language);
        drpLocale.format = OdissBase.dateFormat;

        $('.form-group-date-range').daterangepicker({
            ranges: DRPRanges(OdissApp.language),
            linkedCalendars: false,
            showDropdowns: true,
            "autoUpdateInput": false,
            locale: drpLocale,
            alwaysShowCalendars: true
        });

        $("#lnkDismissCustomSearch").on('click', function () {
            OdissApp.dismissCustomSearch();
        });

        $("#modDocument").on("hidden.bs.modal", function (e) {
            if (OdissApp.searchRefreshOnModalClose || OdissApp.pendingRefreshOnClose) {
                OdissApp.refreshSearch();
                OdissApp.pendingRefreshOnClose = false;
            }

            // Dispose main modal on close
            $("#iViewerBase").attr('src', OdissApp.blankUrl);
        });

        $('.form-group-date-range').on('apply.daterangepicker', function (ev, picker) {
            $(this).find('input').val(picker.startDate.format(OdissBase.dateFormat) + ' - ' + picker.endDate.format(OdissBase.dateFormat));
        });

        $('.form-group-date-range').on('cancel.daterangepicker', function (ev, picker) {
            $(this).find('input').val('');
        });

        $('.form-group-date-range input').on('blur', function () {
            var initialValue = $(this).val();

            try {
                var obj = $(this);
                var validDateFormats = ['MM/DD/YYYY', 'DD MMM YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];

                if (obj != null && obj.val() != '') {
                    var val = obj.val();

                    if (val.indexOf(' - ') >= 0) {
                        var val1 = val.split(' - ')[0];
                        var val2 = val.split(' - ')[1];

                        var dt1 = moment(val1, validDateFormats);
                        var dt2 = moment(val2, validDateFormats);

                        if (dt1.isValid() && dt2.isValid()) {
                            $(this).val(dt1.format(OdissBase.dateFormat) + ' - ' + dt2.format(OdissBase.dateFormat));
                        }
                        else if (dt1.isValid()) {
                            $(this).val(dt1.format(OdissBase.dateFormat));
                        }
                        else if (dt2.isValid()) {
                            $(this).val(dt2.format(OdissBase.dateFormat));
                        }
                    }
                    else {
                        var objDt = moment(val, validDateFormats);

                        if (objDt.isValid()) {
                            $(this).val(objDt.format(OdissBase.dateFormat));
                        }
                    }
                }
            }
            catch (e) {
                $(this).val(initialValue); // Set the initial value, ignoring any changes.
            }
        });

        //
        $("#frmDocuments").validate({
            errorClass: 'help-block',
            errorElement: 'span',
            highlight: function (element, errorClass, validClass) {
                $(element).parent().addClass('has-error');
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).parent().removeClass('has-error');
            },
            submitHandler: function (form) {
                $("#boxRequiresOneFieldSearch").hide();

                if (OdissApp.isExporting) {
                    $("#exporting").val("1");
                    return true;
                }
                else {
                    //e.preventDefault();
                    $("#page").val(1);
                    OdissApp.clearTable();
                    OdissApp.TB.ajax.reload();

                    if (OdissApp.isSearchResultResponsive) {
                        OdissApp.TB.columns.adjust().responsive.recalc();
                    }

                    OdissApp.TB.fixedHeader.enable();

                    return false;
                }
            },
            invalidHandler: function (event, validator) {

            },
            showErrors: function (errorMap, errorList) {
                if (!errorList) return;
                if (errorList.length == 0) return;

                if (errorList[0].method == "require_from_group") {
                    $("#boxRequiresOneFieldSearch").show();
                }
                else {
                    this.defaultShowErrors();
                }
            }
        });

        $.validator.addMethod("odissDate", OdissApp.isValidDateField);

        function addValidation(inputElements) {
            for (var i = 0; i < inputElements.length; i++) {
                var elementName = "#" + inputElements[i].id;

                if ($(elementName).length == 0)
                    continue;

                var validateType = $(elementName).data("validateType");
                var validateMessage = $(elementName).data("validateMessage");

                if (validateType) {
                    if (validateType == "Array") {
                        var minLength = $(elementName).data("validateMinlength");
                        if (minLength && minLength > 0) {
                            var message = $(elementName).data("validateMinlengthmessage");
                            $(elementName).rules("add", {
                                minlength: minLength,
                                messages: { minlength: message }
                            });
                        }

                        var maxLength = $(elementName).data("validateMaxlength");
                        if (maxLength && maxLength > 0) {
                            var message = $(elementName).data("validateMaxlengthmessage");
                            $(elementName).rules("add", {
                                maxlength: maxLength,
                                messages: { maxlength: message }
                            });
                        }
                    }
                    else {
                        var isDate = false;
                        var dateValidateMessage = "";

                        if ($(elementName).data("validateType").indexOf("DateRange") >= 0) {
                            isDate = true;
                            dateValidateMessage = validateMessage;
                        }

                        $(elementName).rules("add", {
                            odissDate: isDate,
                            messages: { odissDate: dateValidateMessage }
                        });
                    }
                }
            }
        }

        function removeValidation(inputElements) {
            for (var i = 0; i < inputElements.length; i++) {
                var elementName = "#" + inputElements[i].id;
                $(elementName).rules("remove");
            }
        }

        addValidation($(":input[data-validate-type]"));

        if (OdissApp.requiresOneFieldForSearch) {
            $(".form-group-validate-required").rules("add", { require_from_group: [1, '.form-group-validate-required'] });
        }
        /*
        $("#frmDocuments").on('submit', function (e) {
            if (OdissApp.isExporting) {
                $("#exporting").val("1");
            }
            else {
                e.preventDefault();
                $("#page").val(1);
                OdissApp.clearTable();
                OdissApp.TB.ajax.reload();
            }
        });
        */
        $("#btnResetSearch").on('click', function () {
            $("#frmDocuments").trigger('reset');
            $("#page").val(0);

            $("#boxCustomSearchAlert").hide();
            $("#INTERNAL_ODISS_QUERY").val('');

            if ($('.form-control-tree').length > 0) {
                $('.form-control-tree').jstree('deselect_all');
                $('.form-control-tree').jstree('close_all');
                $('.form-control-tree').jstree(true).search('');
            }

            var elements = $("#frmDocuments").find('input[type="hidden"]');
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].id.match("^hidden")) {
                    elements[i].value = "";
                }
            }

            $(":radio").trigger('change', [{ firstTrigger: true }]); // Reset Field Events
            OdissApp.clearTable();
            OdissApp.TB.ajax.reload();

            if (OdissApp.isSearchResultResponsive) {
                OdissApp.TB.columns.adjust().responsive.recalc();
            }
        });

        $(".copy-from-to").on('click', function () {
            var fromName = $(this).data('from');
            var toName = $(this).data('to');

            $("[name='" + toName + "']").val($("[name='" + fromName + "']").val());
            $("[name='" + fromName + "']").focus();
        });

        $(".control-filter").dblclick(function () {
            $(this).val('');
        });

        $(".control-filter.autocompletesearch").dblclick(function () {
            try {
                $('#hidden' + this.id).val('');
            }
            catch (e) { }
        });

        $(".radioListSelect input[type=radio]").change(function () {
            if ($(this).is(":checked")) {
                // Hide all selects
                $(this).closest('.radioList').find('select').hide();

                // Show the selected
                var select = $(this).parent().parent().next('select');

                if (select != null)
                    select.show();
            }
        });

        var tree = $('.form-control-tree');

        tree.jstree({
            "plugins": ["checkbox", "html_data", "wholerow", "search"],
            "core": { "themes": { "variant": "small" } },
            "search": {
                "show_only_matches": true, "search": function () { }/*, "search_callback": function (search, node) {
                    if ($(this).find('.jstree-search').length == 0) {
                    }
                }*/
            }
        }).on('ready.jstree', function () { // Preload form state values
            //tree.jstree('open_all'); // Expand all nodes

            // 1. Get selected values from input hidden and selected the fields in the tree
            var idBase = $(this).data('id');
            var inputValues = $('#' + idBase).val();
            var selectedArray = [];

            if (inputValues != null && inputValues.length > 0 && inputValues.substring(0, 1) == "'") {
                inputValues = inputValues.split("','").map(function (value) {
                    if (value.substring(0, 1) == "'")
                        value = value.substring(1);

                    if (value.substring(value.length - 1) == "'")
                        value = value.substring(0, value.length - 1);

                    return value;
                });
            }
            else {
                inputValues = inputValues.split(',');
                $.each(inputValues, function (i, val) {
                    selectedArray.push(idBase + "_" + val);
                });
            }

            $(this).jstree().select_node(selectedArray);
            // /1

            //$(this).css({"visibility":"visible"});

        }).on('changed.jstree', function () {

            // 1. Get selected values and put it to the hidden input to allow submitting with the form
            var idBase = $(this).data('id');
            var inputValues = $(this).siblings('input.hidTreeValue:hidden'); // Attention. If the html structure changes, change it from siblings to anything that fits.
            var selectedValues = $(this).jstree("get_selected").toString().replace(new RegExp(idBase + '_sub_', "g"), '').replace(new RegExp(idBase + '_', "g"), ''); // Remove fieldName from Ids before saving to hidden field
            var arrSelectedValues = selectedValues.split(',');

            var isNumber = true;

            if (arrSelectedValues.length) {

                if (arrSelectedValues.length == 1 && arrSelectedValues[0] == '') {
                    inputValues.val('');
                    return;
                }

                $.each(arrSelectedValues, function (index, value) {
                    if (!$.isNumeric(value)) {
                        isNumber = false;
                        return;
                    }
                });

                if (isNumber) {
                    inputValues.val(selectedValues);
                }
                else {
                    inputValues.val(arrSelectedValues.map(function (value) {
                        return "'" + value.replace("'", "\'") + "'";
                    }).join(','));
                }
            }

            // /1
        }).on('search.jstree', function (e, val) {
            window.postal.publish({
                channel: 'app',
                topic: 'plantTree.search',
                data: {
                    e: e,
                    val: val
                }
            });
            //var obj = $(this);
            //$.each(val.nodes, function (index, value) {
            //    obj.jstree(true).select_node(value);
            //});
        }).on('clear_search.jstree', function (e, val) {
            window.postal.publish({
                channel: 'app',
                topic: 'plantTree.searchCleared',
                data: {
                    e: e,
                    val: val
                }
            });
        });

        $(".form-search-tree").keyup(function () {
            $(this).next('.form-control-tree').jstree(true).search($(this).val());
        });

        var buttons = [];

        if (OdissApp.allowExport) {
            buttons = [
                {
                    autoClose: true,
                    extend: 'collection',
                    text: DTExport(OdissApp.language),
                    enabled: false,
                    buttons: [{
                        text: DTCurrentPage(OdissApp.language),
                        action: function (e, dt, node, config) {
                            OdissApp.isExporting = true;
                            OdissApp.refreshSearch();
                            $("#exporting").val("");
                            OdissApp.isExporting = false;
                        },
                        autoClose: true,
                        className: 'pointer'
                    },
                    {
                        text: DTAllPages(OdissApp.language),
                        action: function (e, dt, node, config) {
                            OdissApp.isExporting = true;
                            var prevPage = $("#page").val();
                            $("#page").val("0");
                            OdissApp.refreshSearch();
                            $("#exporting").val("");
                            $("#page").val(prevPage);
                            OdissApp.isExporting = false;
                        },
                        autoClose: true,
                        className: 'pointer'
                    }]
                }
            ];
        }

        $("#chkListAll").popover({
            content: '<button class="btn btn-primary btn-sm" onclick="OdissApp.openSelectedImages()">' + DTViewAsOneImage(OdissApp.language) + '</button>',
            placement: "top",
            container: "body",
            trigger: "manual",
            html: true,
            viewport: ".main"
        });

        var disableColumnSorting = [0]; // 0 = Checkbox

        if (OdissApp.groupByPos != '')
            disableColumnSorting.push(1); // 1 = Column with grouped data
        else if (OdissApp.groupByPositions.length > 0)
            disableColumnSorting.push(1); // 1 = Column with grouped data

        ///TODO: Error handling
        $.fn.dataTable.ext.errMode = function (settings, techNode, message) {

        };

        OdissApp.TBConfig = {
            deferLoading: 0, ///TODO: TEMP
            language: DTLocale(OdissApp.language),
            //dom: 'itBpr', // Original
            dom: '<"pull-left"i><"pull-right divTableButtons"B>tpr', // New
            "initComplete": function (settings, json) {
                $('#tbDocuments').show();
                $("#page").val(1); // Set to load the pages. Page = 1
            },
            "aaSorting": [], // Disable automatic order
            responsive: OdissApp.getResponsiveOptions(),
            conditionalPaging: true,
            buttons: buttons,
            autoWidth: true,
            "pageLength": OdissApp.maxPerPage,
            columnDefs: [
                {
                    "class": 'checkBoxColumn', targets: 0, render: function (data, type, row, meta) {
                        var showViewer = row[row.length - 3];
                        if (showViewer == "0" || !OdissApp.enableSelection)
                            return "";
                        else {
                            var isDisabled = '';

                            if (row[0] == null || row[0] == '') {
                                isDisabled = "disabled='disabled'";
                                $("#chkListAll").prop("disabled", true);
                            }
                            else {
                                $("#chkListAll").prop("disabled", false);
                            }

                            var dataId = row[0];

                            try {
                                var showNotes = row[row.length - 2];
                                var dataVal = row[meta.col];
                                var returnValue = '';
                                var isMultiple = false;
                                var jdata = null;
                                var fvc = row[OdissApp.firstVisibleColumn];

                                if (fvc && fvc.indexOf('multiple:') > -1 && fvc != "multiple:") {
                                    fvc = fvc.replace("multiple:", "");
                                    jdata = JSON.parse(fvc);
                                    dataVal = jdata.Text;
                                    isMultiple = true;

                                    var multipleIds = [];

                                    for (var m = 0; m < jdata.List.length; m++) {
                                        multipleIds.push(jdata.List[m].GUID);
                                    }

                                    dataId = multipleIds.join(',');
                                }
                            } catch (exep) {
                            }

                            return '<input type="checkbox" data-id="' + dataId + '" ' + isDisabled + '  />';
                        }
                    }
                },
                { orderable: false, targets: disableColumnSorting }
                //{ className: 'control', orderable: false, targets: -1 } ///TODO: Plus at right
            ],
            "drawCallback": function (settings) {
                //if (!OdissApp.drawed) {
                // Add more functions
                try {
                    // Group rows by unique position
                    if (OdissApp.groupByPos != null && OdissApp.groupByPos != '') {
                        var columnToGroup = parseInt(OdissApp.groupByPos) + 1; // Add 1 to position because of checkbox
                        var api = this.api();
                        var rows = api.rows({ page: 'all' }).nodes();
                        var last = null;
                        var ungroup = [];

                        //api.columns().data().each(function (group, i) {
                        api.rows().data().each(function (group, i) {
                            var curGroup = $(rows).eq(i).find('td:eq(' + columnToGroup + ')').text().trim();

                            if ($(rows).eq(i + 1) != null && $(rows).eq(i + 1).find('td:eq(' + columnToGroup + ')').text().trim() != curGroup) {
                                if (ungroup.length > 0) {
                                    ungroup.push({ text: $(rows).eq(i).find('td:eq(1)').text().trim(), id: $(rows).eq(i).find('td:eq(1) a').data('id') });
                                    $(rows).eq(i).find('td:eq(0)').html('<span class="btnExpand">+</span>');
                                    $(rows).eq(i).find('td:eq(0)').html('');
                                    $(rows).eq(i).find('td:eq(1)').html('');
                                    $(ungroup).each(function (ind, val) {
                                        $(rows).eq(i).find('td:eq(0)').append('<input type="checkbox" data-id="' + val.id + '">');
                                        $(rows).eq(i).find('td:eq(1)').append('<a href class="link-open-document pointer" data-id="' + val.id + '">' + (val.text != null && val.text != '' ? val.text : '&lt;' + OdissApp.emptyColumn + '&gt;') + '</a>');//.html(ungroup);
                                    });
                                }
                                ungroup = [];
                            }
                            else {
                                //if (!OdissApp.drawed)
                                ungroup.push({ text: $(rows).eq(i).find('td:eq(1)').text().trim(), id: $(rows).eq(i).find('td:eq(1) a').data('id') });
                                $(rows).eq(i).remove();
                            }
                        });
                    }
                    else if (OdissApp.groupByPositions.length > 0) {
                        // Group rows by one/many positions
                        //

                        var columnsToGroup = [];

                        // Add 1 position because of the first one is the checkbox
                        for (var i = 0; i < OdissApp.groupByPositions.length; i++) {
                            columnsToGroup.push(OdissApp.groupByPositions[i] + 1);
                        }

                        var api = this.api();
                        var rows = api.rows({ page: 'all' }).nodes();
                        var last = null;
                        var ungroup = [];

                        api.rows().data().each(function (group, i) {
                            var currentRow = $(rows).eq(i);
                            var nextRow = $(rows).eq(i + 1);

                            var curGroup = $.map(columnsToGroup, function (v, gPos) {
                                return currentRow.find('td:eq(' + v + ')').text().trim();
                            }).join(",");

                            var nextGroup = null;

                            if (nextRow != null) {
                                nextGroup = $.map(columnsToGroup, function (v, gPos) {
                                    return nextRow.find('td:eq(' + v + ')').text().trim();
                                }).join(",");;
                            }

                            if (nextGroup != null && nextGroup != curGroup) {
                                if (ungroup.length > 0) {
                                    ungroup.push({ text: currentRow.find('td:eq(1)').text().trim(), id: currentRow.find('td:eq(1) a').data('id') });
                                    currentRow.find('td:eq(0)').html('<span class="btnExpand">+</span>');
                                    currentRow.find('td:eq(0)').html('');
                                    currentRow.find('td:eq(1)').html('');
                                    $(ungroup).each(function (ind, val) {
                                        currentRow.find('td:eq(0)').append('<input type="checkbox" data-id="' + val.id + '"><br />');
                                        currentRow.find('td:eq(1)').append('<a href class="link-open-document pointer" style="line-height:22px;" data-id="' + val.id + '">' + (val.text != null && val.text != '' ? val.text : '&lt;' + OdissApp.emptyColumn + '&gt;') + '</a><br />');//.html(ungroup);
                                    });
                                }
                                ungroup = [];
                            }
                            else {
                                ungroup.push({ text: currentRow.find('td:eq(1)').text().trim(), id: currentRow.find('td:eq(1) a').data('id') });
                                currentRow.remove();
                            }
                        });
                    }

                    postal.publish({
                        channel: 'app',
                        topic: 'draw.complete'
                    });

                    OdissApp.drawed = true;

                    //var hasAction = $('[data-result-field="17973013-12d2-e811-8220-d89ef34a256d"]').length === 1;
                    //console.log(hasAction);
                }
                catch (e) {
                    //alert(e);
                }

                //}
            }
        };

        OdissApp.TBConfig.processing = true;
        OdissApp.TBConfig.serverSide = true;
        OdissApp.TBConfig.fixedHeader = { header: true, headerOffset: OdissApp.getNavbarHeight() };
        OdissApp.TBConfig.ajax = {
            url: OdissApp.baseUrl + '/', type: "POST", data: function (d) {
                if (OdissApp.TB != null) {
                    var order = OdissApp.TB.order();
                    if (order != null && order.length > 0) {
                        $("#sort").val(order[0][0] + "," + order[0][1]);
                    }
                }

                /* Ignore HTML tags. TODO:
                var serializedForm = $("#frmDocuments").serializeArray();

                for (var i = 0, len = serializedForm.length; i < len; i++) {
                    if (serializedForm[i].value != "") {
                        serializedForm[i].value = serializedForm[i].value.replace(/[<>]/ig, '');
                    }
                }
                serializedForm = $.param(serializedForm);

                return serializedForm; // ;
                */

                var result = $("#frmDocuments").serialize();

                postal.publish({
                    channel: 'app',
                    topic: 'search.complete',
                    data: d
                });

                return result;
            }/*,
            error: function () {
                return true;
                //$('.dataTables_processing', $('#example').closest('.dataTables_wrapper')).hide();
            }*/
        };
        /* Added directly to the first columndefs
        OdissApp.TBConfig.columnDefs[0].render = function (data, type, row) {
            var showViewer = row[row.length - 3];
            if (showViewer == "0")
                return "";
            else {
                var isDisabled = '';

                if (row[0] == null || row[0] == '') {
                    isDisabled = "disabled='disabled'";
                    $("#chkListAll").prop("disabled", true);
                }
                else
                {
                    $("#chkListAll").prop("disabled", false);
                }

                return '<input type="checkbox" data-id="' + row[0] + '" ' + isDisabled + '  />';
            }
        };
        */
        /*
        OdissApp.TBConfig.columnDefs.push({
            targets: 1, render: function (data, type, row, meta) {
                var showNotes = row[row.length - 2];
                //var showViewer = row[row.length - 3];
                var dataId = row[0];
                var dataVal = row[1];
                var returnValue = '<a href class="link-open-document pointer" data-id="' + dataId + '"> ' + (dataVal != null && dataVal != '' ? dataVal : '&lt;' + OdissApp.emptyColumn + '&gt;') + '</a>';

                //var returnValue = "";
                //if (showViewer == "0")
                //{
                //    returnValue = '<a href class="link-open-file pointer" data-id="' + dataId + '"> ' + (dataVal != null && dataVal != '' ? dataVal : '&lt;' + OdissApp.emptyColumn + '&gt;') + '</a>';
                //}
                //else
                //{
                //    returnValue = '<a href class="link-open-document pointer" data-id="' + dataId + '"> ' + (dataVal != null && dataVal != '' ? dataVal : '&lt;' + OdissApp.emptyColumn + '&gt;') + '</a>';
                //}

                if (showNotes == "1")
                {
                    returnValue += $("<div/>").append($(".aOpenNotesClone").clone().attr("data-poload", dataId).removeClass("aOpenNotesClone").show()).html() + '<span class="notespopup hidden-sm hidden-xs"></span>';
                    //returnValue += '<a tabindex="0" class="btnOpenNotes glyphicon glyphicon-file pull-right" data-placement="left" data-toggle="popover" data-trigger="focus" data-poload="' + row[0] + '" title="' + Words.Notes + '" role="button" style="color:#F1D18F"></a><span class="notespopup hidden-sm hidden-xs"></span>';
                }
                return returnValue;
            },
        });
        */

        var fnFormatColumnTableRow = function (row) {
            var dataRow = "";
            var columns = row.split(' | ');

            dataRow += "<tr>";

            for (var j = 0; j < columns.length; j++) {
                dataRow += "<td align='right'>" + OdissApp.toLanguage(columns[j]) + "</td>";
            }

            dataRow += "</tr>";

            return dataRow;
        }

        OdissApp.TBConfig.columnDefs.push({
            targets: "_all", render: function (data, type, row, meta) {
                if (data && data.indexOf("array:") > -1) {
                    var dataReturn = "";
                    var originalData = data;

                    var data = data.replace("array:", "");
                    var jdata = JSON.parse(data);

                    var dataShow = "";
                    if (jdata[0][0]) {
                        dataShow = jdata[0][0];
                    }
                    else {
                        if (jdata[1][0]) {
                            dataShow = jdata[1][0];
                        }
                    }

                    var dataContente = "";

                    if (jdata[1].length > 0 && jdata[2][0] != "" && jdata[2][0] != null) {
                        if (typeof fnCustomArrayLink === "function") {

                            var linkArrayCustomTitle = "View";

                            if (typeof fnCustomArrayLinkGetTitle === "function") {
                                linkArrayCustomTitle = fnCustomArrayLinkGetTitle();
                            }

                            dataContente +=
                                "<a class='btn btn-default btn-xs pull-right' style='margin-bottom:10px;' href=javascript:OdissApp.openCustomArrayLink('" + row[0] + "')>" + linkArrayCustomTitle + "</a>";
                        }

                        dataContente += "<table class='table table-striped table-bordered table-responsive' style='margin:0px;'>";
                        dataContente += "<thead style='background-color:#888 !important'>" + fnFormatColumnTableRow(jdata[2][0]) + "</thead>";

                        for (var i = 0; i < jdata[1].length; i++) {
                            if (dataContente.length > 0) {

                            }

                            if (jdata[1][i] != "" && jdata[1][i] != null) {
                                dataContente += fnFormatColumnTableRow(jdata[1][i]);
                            }
                        }

                        dataContente += "</table>";
                    }
                    else {/*
                        var iCol = 0;
                        for (var i = 0; i < row.length; i++) {
                            if (row[i] == originalData) {
                                iCol = i;
                                break;
                            }
                        }

                        dataContente += "<thead>" + OdissApp.TB.column(iCol).header().innerText + "</thead>";*/
                    }

                    var popoverHeader = "";/*
                    if (jdata[2][0] != "") {
                        popoverHeader = jdata[2][0];
                    }
                    else {
                        var iCol = 0;
                        for (var i = 0; i < row.length; i++) {
                            if (row[i] == originalData) {
                                iCol = i;
                                break;
                            }
                        }
                        popoverHeader = OdissApp.TB.column(iCol).header().innerText
                    }*/

                    if (dataContente != "") {
                        dataReturn = "<a tabindex=\"0\" title=\"\" class=\"arraypopup\" data-original-title=\"" + popoverHeader + "\" data-toggle=\"popover\" data-arraypopover=\"" + row[0] + "\" data-trigger=\"focus\" data-content=\"" + dataContente + "\">" + dataShow + "</a>";
                    }


                    /* OLD FORMAT - NOT FORMATTED

                    for (var i = 0; i < jdata[1].length; i++) {
                        if (dataContente.length > 0) {
                            dataContente += "<hr style='margin:5px 0px;' />";
                        }
                        dataContente += jdata[1][i];
                    }

                    var popoverHeader = "";
                    if (jdata[2][0] != "") {
                        popoverHeader = jdata[2][0];
                    }
                    else {
                        var iCol = 0;
                        for (var i = 0; i < row.length; i++) {
                            if (row[i] == originalData) {
                                iCol = i;
                                break;
                            }
                        }
                        popoverHeader = OdissApp.TB.column(iCol).header().innerText
                    }

                    dataReturn = "<a tabindex=\"0\" title=\"\" class=\"arraypopup\" data-original-title=\"" + popoverHeader + "\" data-toggle=\"popover\" data-arraypopover=\"" + row[0] + "\" data-trigger=\"focus\" data-content=\"" + dataContente + "\">" + dataShow + "</a>";
                    */

                    return dataReturn;
                }
                else if (data && data.indexOf("buttons:") > -1) {
                    if (data == "buttons:") {
                        return "";
                    }
                    else {
                        var dataReturn = '<div class="btn-group" style="text-align:center;">';

                        dataReturn += '<button type="button" class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="margin-left:3px"><span class="caret" style="height:13px;"></span></button>';
                        dataReturn += '<ul class="dropdown-menu dropdown-menu-right">';

                        var data = data.replace("buttons:", "");
                        var jdata = JSON.parse(data);

                        for (var i = 0; i < jdata.length; i++) {
                            var icon = '';

                            if (jdata[i].Icon) {
                                icon = '<span class="glyphicon glyphicon-' + jdata[i].Icon + '"></span> ';
                            }

                            dataReturn += '<li><a href="javascript:void(0)" onclick="' + jdata[i].Call + '(\'' + row[0] + '\', ' + meta.row + ',' + meta.col + ')">' + icon + OdissApp.toLanguage(jdata[i].Title) + '</a></li>';
                        }

                        dataReturn += '</ul>';
                        dataReturn += '</div>';

                        return dataReturn;
                    }
                }
                else {
                    if (meta.col == OdissApp.firstVisibleColumn) {
                        var showNotes = row[row.length - 2];
                        var showViewer = row[row.length - 3];
                        var dataId = row[0];
                        var dataVal = row[meta.col];
                        var returnValue = '';
                        var isMultiple = false;
                        var jdata = null;

                        if (data && data.indexOf('multiple:') > -1 && data != "multiple:") {
                            data = data.replace("multiple:", "");
                            jdata = JSON.parse(data);
                            dataVal = jdata.Text;
                            isMultiple = true;

                            var multipleIds = [];

                            for (var m = 0; m < jdata.List.length; m++) {
                                multipleIds.push(jdata.List[m].GUID);
                            }

                            dataId = multipleIds.join(',');
                        }

                        if (dataId != null && dataId != '' && showViewer != "0") {
                            returnValue += '<a href class="link-open-document pointer" data-id="' + dataId + '"> ';
                        }

                        returnValue += (dataVal != null && dataVal != '' ? dataVal : '&lt;' + OdissApp.emptyColumn + '&gt;');

                        if (dataId != null && dataId != '' && showViewer != "0") {
                            returnValue += '</a>';
                        }

                        if (isMultiple && showViewer != "0" && jdata.List.length > 1) {

                            returnValue += '<div class="btn-group">';
                            returnValue += '<span class="caret" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="cursor:pointer;margin-left:5px;"></span>';
                            returnValue += '<ul class="dropdown-menu">';

                            for (var m = 0; m < jdata.List.length; m++) {
                                returnValue += '<li><a href="javascript:void(0);" class="link-open-document pointer" data-id="' + jdata.List[m].GUID + '" data-extra="single">' + OdissApp.toLanguage(jdata.List[m].Text) + '</a></li>';
                            }

                            returnValue += '</ul>';
                            returnValue += '</div>';
                        }

                        //'<a href class="link-open-document pointer" data-id="' + dataId + '"> ' + (dataVal != null && dataVal != '' ? dataVal : '&lt;' + OdissApp.emptyColumn + '&gt;') + '</a>';

                        //var returnValue = "";
                        //if (showViewer == "0")
                        //{
                        //    returnValue = '<a href class="link-open-file pointer" data-id="' + dataId + '"> ' + (dataVal != null && dataVal != '' ? dataVal : '&lt;' + OdissApp.emptyColumn + '&gt;') + '</a>';
                        //}
                        //else
                        //{
                        //    returnValue = '<a href class="link-open-document pointer" data-id="' + dataId + '"> ' + (dataVal != null && dataVal != '' ? dataVal : '&lt;' + OdissApp.emptyColumn + '&gt;') + '</a>';
                        //}

                        if (showNotes == "1") {
                            returnValue += $("<div/>").append($(".aOpenNotesClone").clone().attr("data-poload", dataId).removeClass("aOpenNotesClone").show()).html() + '<span class="notespopup hidden-sm hidden-xs"></span>';
                            //returnValue += '<a tabindex="0" class="btnOpenNotes glyphicon glyphicon-file pull-right" data-placement="left" data-toggle="popover" data-trigger="focus" data-poload="' + row[0] + '" title="' + Words.Notes + '" role="button" style="color:#F1D18F"></a><span class="notespopup hidden-sm hidden-xs"></span>';
                        }
                        return returnValue;
                    }
                    else {
                        return data;
                    }
                }
            }
        });

        OdissApp.TBConfig.columnDefs.push({
            targets: -1,
            responsivePriority: 1
        });
        /* Removed temporarly
        OdissApp.TBConfig.columnDefs.push({
            targets: -1, render: function (data, type, row) {
                try
                {
                    if (data != null && data != '') {
                        if (row != null && row.length >= 1) {
                            return "<span title=\"Submitted by: " + row[row.length - 1] + "\">" + data + "</span>";
                        }
                    }
                }
                catch (e) { }

                return data;
            }
        });
        */
        /*
        OdissApp.TBConfig.createdRow = function (row, data, dataIndex) {
            if (data[data.length - 1] == "1") // hasNotes = true
            {
                $(row).attr('data-placement','left');
                $(row).attr('data-toggle', 'popover');
                $(row).attr('data-trigger', 'focus');
                $(row).attr('data-poload', data[0]); // guid
            }
        };*/

        OdissApp.TB = $('#tbDocuments').DataTable(OdissApp.TBConfig);

        $("#tbDocuments").on('page.dt', function () {
            $("#page").val(OdissApp.TB.page.info().page + 1);
        });

        OdissApp.TB.on('responsive-display', function (e, datatable, row, showHide, update) {
            postal.publish({
                channel: 'app',
                topic: 'responsive.display',
                data: {
                    datatable: datatable,
                    row: row,
                    showHide: showHide,
                    update: update
                }
            });
        });

        $("#tbDocuments").on('draw.dt', function () {
            OdissApp.showHideExport();
            OdissApp.showHideViewAsOneImage();

            if (OdissApp.isSearchResultResponsive) {
                OdissApp.TB.columns.adjust().responsive.recalc();
            }
        });

        $("#tbDocuments").on("xhr.dt", function () {
            var xhrResult = OdissApp.TB.ajax.json();

            if (xhrResult) {
                if (xhrResult.IsAuthenticated != null && !xhrResult.IsAuthenticated) {
                    OdissBase.showDisconnected();
                }
            }
        });

        $("#tbDocuments").on("error.dt", function () {
            $("#tbDocuments_info").text('Invalid request. Try again.');//.empty();
        });

        $("#tbDocuments").on('init.dt', function () {
            $(".dataTables_empty").html("");
        });

        $('#tbDocuments tbody').on('click', 'tr td.checkBoxColumn', function () {
            try {
                OdissApp.TB.fixedHeader.adjust();
            }
            catch (e) { }
        });

        $("#tbDocuments").on('click', '*[data-poload]', function (e) {
            e.stopPropagation();
            e.preventDefault();

            var obj = $(this);

            //e.off('hover');

            // Hide popup for small devices
            if (obj.find('.notespopup').length > 0 && !obj.find('.notespopup').is(':visible')) {
                return;
            }

            var id = obj.data('poload');

            if (OdissApp.NotesCache[id] == null) {
                $.post(OdissApp.baseUrl + '/getnotes', { idd: id })
                    .done(function (data) {
                        if (data.IsAuthenticated != null && !data.IsAuthenticated) {
                            OdissBase.showDisconnected();
                            return;
                        }

                        if (data.Success) {
                            OdissApp.NotesCache[id] = data.Data;
                            OdissApp.showNotesPopup(obj, data.Data);
                        }
                        else {
                            //TODO: Show error message
                        }
                    });
            }
            else {
                OdissApp.showNotesPopup(obj, OdissApp.NotesCache[id]);
            }
        });

        $("#tbDocuments").on('click', '*[data-arraypopover]', function (e) {
            e.stopPropagation();
            e.preventDefault();

            var obj = $(this);

            var id = obj.data('arraypopover');
            OdissApp.showArrayPopup(obj, obj.data('content'));
        });

        $("#tbDocuments").on('click', '.link-open-document', function (e) {
            e.stopPropagation();
            e.preventDefault();

            $("#iViewerBase").attr('src', OdissApp.blankUrl);

            OdissApp.closePopover();

            var dataId = $(this).data('id');
            var dataExtra = $(this).data('extra');

            $("#hidExtra").val('');

            if (OdissApp.groupByPositions.length == 0) {
                var rowData = OdissApp.TB.row($(this).parents('tr')).data();

                //if (dataId && dataId.indexOf(',') > -1) {
                $("#hidDoc").val(dataId);
                //}
                //else {
                //    $("#hidDoc").val(rowData[0]);
                //}

                if (dataExtra) {
                    $("#hidExtra").val(dataExtra);
                }
            }
            else {
                $("#hidDoc").val(dataId);
            }

            $("#tmpForm").trigger('submit');

            $("#modDocument").modal();

            postal.publish({
                channel: 'app',
                topic: 'document.open',
                data: {
                    dataId: dataId,
                    dataExtra: dataExtra
                }
            });
        });

        //$("#tbDocuments").on('click', '.link-open-file', function (e) {
        //    e.stopPropagation();
        //    e.preventDefault();

        //    if (OdissApp.useAjax) {
        //        var rowData = OdissApp.TB.row($(this).parents('tr')).data();

        //        $("#hidDoc").val(rowData[0]);
        //    }
        //    else {

        //        $("#hidDoc").val($(this).data('id'));
        //    }

        //    $("#FileIdentification").val($("#hidDoc").val());
        //    $("#AppIdentification").val(OdissApp.baseUrl.replace('/app/', ''));

        //    $("#tmpOpenFileForm").trigger('submit');
        //});

        $("#btnSubmitDocument").on('click', function (e) {
            e.stopPropagation();
            e.preventDefault();

            //$("#hidDoc").val($(this).data('id'));
            $("#tmpSubmitForm").trigger('submit');

            $("#modSubmitDocument").modal();
        });

        $('#tbDocuments tbody').on('click', 'tr', function (e) {
            if (e.target.type == 'checkbox') {
                e.stopPropagation();

                if ($(this).find('input:checkbox:checked').not(":disabled").length == $(this).find('input:checkbox').length) {
                    if (!$(this).hasClass('info')) {
                        $(this).addClass('info');
                        $(this).find('input:checkbox').prop('checked', true);
                    }
                }
                else {
                    if ($(this).hasClass('info')) {
                        $(this).removeClass('info');
                        $(this).find('input:checkbox').prop('checked', false);
                    }
                }

                var td = $(e.target).closest('td');
                td.trigger('click');
            }
            else if (e.target.className != null &&
                (e.target.className.indexOf('link-open-document') != -1 ||
                    //e.target.className.indexOf('link-open-file') != -1 ||
                    e.target.className.indexOf('btnOpenNotes') != -1 ||
                    e.target.className.indexOf('arraypopup') != -1) ||
                $(e.target).find('.link-open-document').length > 0) // Nice gambi.
            // || $(e.target).find('.link-open-file').length > 0
            {
                // Do nothing
            }
            /* DO NOT CHECK THE ROW CLICLINK ON TD

        else {
            if ($(this).parent().prop('tagName') != 'THEAD') {
                if ($(this).find('input:checkbox').not(":disabled").length > 0) {
                    if ($(this).hasClass('info')) {
                        $(this).removeClass('info');
                        $(this).find('input:checkbox').prop('checked', false);
                    }
                    else {
                        $(this).addClass('info');
                        $(this).find('input:checkbox').prop('checked', true);
                    }
                }
            }
        }*/

            setTimeout(OdissApp.showHideViewAsOneImage, 200);
        });

        if ($(".multipleValuesFieldButton")) {
            $(".multipleValuesFieldButton").each(function (i) {

                try {
                    if (!window.FileReader) {
                        $(this).hide();
                        return;
                    }

                    var valueID = $(this).data('value-id');
                    var inputF = $("<input type='file' data-value-id='" + valueID + "'>");

                    inputF.on('change', function (evt) {

                        try {
                            var files = evt.target.files;

                            var output = [];
                            for (var i = 0, f; f = files[i]; i++) {

                                if (!f.type.match('text/plain') &&
                                    !f.type.match('application/vnd.ms-excel') &&
                                    !f.type.match('*csv*')) {
                                    alert('Invalid file format. Only .txt and .csv files are accepted.');
                                    $(this).val('');
                                    break;
                                }

                                var reader = new FileReader();

                                // Closure to capture the file information.
                                reader.onload = (function (theFile) {
                                    return function (e) {
                                        var res = OdissApp.setMultipleValues(e.target.result);

                                        $("#" + valueID).val(res.join(','));
                                    };
                                })(f);

                                reader.readAsText(f);

                                $(this).val('');

                                break; // Get only the first file
                            }
                        }
                        catch (e) {
                            alert('Error reading the file. Only .txt and .csv files are accepted.');
                        }
                    });

                    $(this).after(inputF);
                }
                catch (e) { }
            });
        }

        if ($("#chkListAll")) {
            $("#chkListAll").click(function () { // Check all
                var obj = $(this);
                $("#tbDocuments input[id!='chkListAll']:checkbox").each(function (index, value) {
                    var objTr = $(value).closest('tr');

                    $(this).prop('checked', obj.prop('checked'));

                    if (obj.prop('checked')) {
                        if (!objTr.hasClass('info')) {
                            objTr.addClass('info');
                        }
                    }
                    else {
                        if (objTr.hasClass('info')) {
                            objTr.removeClass('info');
                        }
                    }
                });

                OdissApp.showHideViewAsOneImage();
            });
        }

        $("#tbDocuments input[id!='chkListAll']:checkbox").click(function () { // All except 'Check all'
            var closestTr = $(this).find('tr');
            if (closestTr.hasClass('info')) {
                closestTr.removeClass('info');
            }
            else {
                closestTr.addClass('info');
            }

            OdissApp.showHideViewAsOneImage();
        });

        $(".autocompletesearch").each(function (i) {
            var minChars = $(this).data("autocomplete-minchars");
            var showNoSuggestions = $(this).data("autocomplete-shownosuggestions");

            if (!minChars && minChars != 0)
                minChars = 1;

            showNoSuggestions = showNoSuggestions == "1";

            $("#" + this.id).autocomplete({
                minChars: minChars,
                showNoSuggestionNotice: showNoSuggestions,
                serviceUrl: OdissApp.baseUrl + '/SearchAutoComplete',
                noCache: true,
                params: { appid: OdissApp.baseUrl, mapTo: this.id },
                onSelect: function (suggestion) {
                    var hiddenElement = "hidden" + this.id;
                    $("#" + hiddenElement).val(suggestion.data);
                }
                //onSearchComplete: function () {
                //},
                //onHide: function () {
                //},
                //onSearchError: function (query, jqXHR, textStatus, errorThrown) {
                //    var bla = a;
                //}
            });

            $("#" + this.id).on('input', function () {
                $("#hidden" + this.id).val("");
            });

        });

        try {
            // Update columns visibility
            if (this.fieldEvents != null && this.fieldEvents.length > 0) {
                for (var i = 0; i < this.fieldEvents.length; i++) {
                    var currentFieldEvents = this.fieldEvents[i];

                    if (currentFieldEvents.Events != null && currentFieldEvents.Events.length > 0) {
                        for (var j = 0; j < currentFieldEvents.Events.length; j++) {
                            var currentEvent = currentFieldEvents.Events[j];

                            if (currentEvent.Event == "change") {
                                $("[name='" + this.fieldEvents[i].Field + "']").change(function (e, customData) {

                                    if (!$(this).is(':checked'))
                                        return;

                                    var selectedValue = $(this).val();

                                    if (currentEvent.Clauses != null) {
                                        for (var k = 0; k < currentEvent.Clauses.length; k++) {
                                            var currentClause = currentEvent.Clauses[k];

                                            if (currentClause.ValueIsEqualsTo != null &&
                                                currentClause.ValueIsEqualsTo == selectedValue) {
                                                if (currentClause.Actions != null && currentClause.Actions.length > 0) {
                                                    for (var l = 0; l < currentClause.Actions.length; l++) {
                                                        var currentAction = currentClause.Actions[l];
                                                        var targetFieldSearch = $("[name='" + currentAction.TargetField + "']");
                                                        var targetFieldResult = $("[data-result-field='" + currentAction.TargetField + "']:first");
                                                        var resultIndex = targetFieldResult.data('result-index');

                                                        if (currentAction.Action === 1) // Show
                                                        {
                                                            targetFieldSearch.show();

                                                            $(OdissApp.TB.column(resultIndex).header()).removeClass('never');
                                                        }
                                                        else if (currentAction.Action === 0) // Hide
                                                        {
                                                            targetFieldSearch.val('');
                                                            targetFieldSearch.hide();

                                                            $(OdissApp.TB.column(resultIndex).header()).addClass('never');
                                                        }
                                                        else if (currentAction.Action === 2) // Populate dropdown
                                                        {
                                                            var fieldTitle = targetFieldSearch.prop('title');

                                                            targetFieldSearch.empty();

                                                            targetFieldSearch.append($('<option>', {
                                                                value: '',
                                                                text: fieldTitle
                                                            }));

                                                            for (var iData = 0; iData < currentAction.Data.length; iData++) {
                                                                targetFieldSearch.append($('<option>', {
                                                                    value: currentAction.Data[iData].Code,
                                                                    text: currentAction.Data[iData].Name
                                                                }));
                                                            }
                                                        }
                                                        else if (currentAction.Action === 3) // Change field title
                                                        {
                                                            targetFieldSearch.prop('placeholder', currentAction.Data);
                                                            targetFieldSearch.prop('title', currentAction.Data);
                                                            $(OdissApp.TB.column(resultIndex).header()).text(currentAction.Data);
                                                        }

                                                        OdissApp.TB.responsive.rebuild();
                                                        OdissApp.TB.responsive.recalc();
                                                    }
                                                }
                                            }
                                        }

                                        // Go through all columns and check the first visible
                                        for (var i = 1; i < OdissApp.TB.columns().header().length; i++) { // Skip first column (checkbox)
                                            if (!$(OdissApp.TB.column(i).header()).hasClass('never')) {
                                                OdissApp.firstVisibleColumn = i;
                                                break;
                                            }
                                        }

                                        if (!customData) { // Do not reload when calling only to rebuild the columns
                                            OdissApp.clearTable();
                                            OdissApp.TB.ajax.reload();
                                        }

                                        if (OdissApp.isSearchResultResponsive) {
                                            OdissApp.TB.columns.adjust().responsive.recalc();
                                        }
                                    }
                                });
                                $("[name='" + this.fieldEvents[i].Field + "']").trigger('change', [{ firstTrigger: true }]);
                            }
                        }
                    }
                }
            }

            $.notifyDefaults({
                offset: { x: 20, y: 70 }
            });

        } catch (e) { }

        $(document).on('shown.bs.popover', function (ev) {
            var $target = $(ev.target);
            if (OdissApp.currentPopover && (OdissApp.currentPopover.get(0) != $target.get(0))) {
                OdissApp.currentPopover.popover('toggle');
            }
            OdissApp.currentPopover = $target;
        });

        $(document).on('hidden.bs.popover', function (ev) {
            var $target = $(ev.target);
            if (OdissApp.currentPopover && (OdissApp.currentPopover.get(0) == $target.get(0))) {
                OdissApp.currentPopover = null;
            }
        });

        $('body, html').on('click', function (e) {
            //did not click a popover toggle or popover
            if ($(e.target).data('toggle') !== 'popover'
                && $(e.target).parents('.popover.in').length === 0) {
                OdissApp.closePopover();
            }
        });

        postal.publish({
            channel: 'app',
            topic: 'start'
        });
    },
    toLanguage: function (value) {
        try {
            if (value == null || value == '') return value;
            if (value[0] != "{") return value;

            var parsed = JSON.parse(value);

            if (parsed[OdissApp.language] != null && parsed[OdissApp.language] != "") return parsed[OdissApp.language];

            return parsed["en"];
        }
        catch (e) {
        }

        return value;
    },
    refreshSearch: function () {
        $("#frmDocuments").submit();

        if (this.refreshEvents != null && this.refreshEvents.length > 0) {
            for (var i = 0; i < this.refreshEvents.length; i++) {
                this.refreshEvents[i]();
            }
        }
    },
    refreshOnClose: function () {
        OdissApp.pendingRefreshOnClose = true;
    },
    closeMainModal: function () {
        $('#modDocument').modal('hide');
    },
    getResponsiveOptions: function () {
        /*
        if (OdissApp.isSearchResultResponsive)
        {
            return { details: { target: 'td:visible', type: 'column' } };
        }
        */

        return OdissApp.isSearchResultResponsive;
    },
    dismissCustomSearch: function () {
        $("#boxCustomSearchAlert").hide();
        $("#INTERNAL_ODISS_QUERY").val('');
        OdissApp.refreshSearch();
        ///TODO:
    },
    setCustomSearch: function (customSearchId) {
        $("#boxCustomSearchAlert").show();
        $("#INTERNAL_ODISS_QUERY").val(customSearchId);
        OdissApp.refreshSearch();
        ///TODO:
    },
    openGlobalModal: function (title, url) {
        $("#globalModalLabel").text(title);
        $("#iGlobalModal").attr("src", OdissApp.blankUrl);
        $("#iGlobalModal").attr("src", url);
        $("#globalModal").modal();
    },
    openCustomArrayLink: function (data) {
        fnCustomArrayLink(data);

        OdissApp.closePopover();
    },
    closePopover: function () {
        try { $('[data-toggle="popover"]').popover('hide'); } catch (e) { }
    },
    clearTable: function () {
        $("#tbDocuments tbody").empty();
        $("#tbDocuments_paginate").empty();
        $("#tbDocuments_info").text(OdissApp.loadingText);//.empty();
    },
    getNavbarHeight: function () {
        if ($("#navbar").is(':visible')) {
            return $('#navbar').height();
        }
        else {
            return 0;
        }
    },
    setMultipleValues: function (value) {
        var withComma = false;
        var withBreakLines = false;
        var withSpaces = false;
        var allItems = [];

        if (value) {
            var totalCommas = (value.match(/,/g) || []).length;
            var totalBreakLines = (value.match(/\r?\n/g) || []).length;
            var totalSpaces = (value.match(/ /g) || []).length;

            if (totalCommas > 0) {
                allItems = value.split(/,/g);
            }
            else if (totalBreakLines > 0) {
                allItems = value.split(/\r?\n/g);
            }
            else if (totalSpaces > 0) {
                allItems = value.split(/ /g);
            }

            var newArray = new Array();

            for (var i = 0; i < allItems.length; i++) {
                if (allItems[i]) {
                    newArray.push(escape(allItems[i].replace('<', '').replace('>', '')));
                }
            }

            allItems = newArray;
        }

        return allItems;
    },
    isValidDateField: function (value, obj) {
        try {
            var validDateFormats = ['MM/DD/YYYY', 'DD MMM YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];

            obj = $(obj);

            if (obj != null && obj.val() != '') {
                var val = obj.val();

                if (val.indexOf(' - ') >= 0) {
                    var val1 = val.split(' - ')[0];
                    var val2 = val.split(' - ')[1];

                    var dt1 = moment(val1, validDateFormats);
                    var dt2 = moment(val2, validDateFormats);

                    if (!dt1.isValid() || !dt2.isValid()) {
                        return false;
                    }
                }
                else {
                    var objDt = moment(val, validDateFormats);

                    if (!objDt.isValid()) {
                        return false;
                    }
                }
            }
        }
        catch (e) {
            return false;
        }

        return true;
    },
    showHideExport: function () {
        if (OdissApp.allowExport) {
            OdissApp.TB.button(0).enable(OdissApp.TB.rows().count() > 0);
        }
    },
    showNotesPopup: function (popObj, data) {
        popObj.popover({ html: true, trigger: "focus", content: data }).popover('toggle');
    },
    showArrayPopup: function (popObj, data) {
        var popoverTemplate = '<div class="popover popoverarray"><div class="arrow" ></div><div class="popover-title"></div><div class="popover-content"></div></div>';
        popObj.popover({ html: true, trigger: "manual", placement: "left", template: popoverTemplate, content: data }).popover('toggle');
    },
    openSelectedImages: function () {
        $("#chkListAll").popover("hide");

        var ids = [];

        $("#tbDocuments input[id!='chkListAll']:checked").each(function (index, value) {
            ids.push($(this).data("id"));
        });

        $("#hidDoc").val(ids);
        $("#iViewerBase").attr("src", OdissApp.blankUrl);
        $("#tmpForm").trigger("submit");

        $("#modDocument").modal();
    },
    showHideViewAsOneImage: function () {
        var totalSelected = $("#tbDocuments input[id!='chkListAll']:checked").not(":disabled").length;

        if (totalSelected > 1) // Two or more selected, show 'View as one image'
        {
            $("#chkListAll").popover("show");

            try {
                OdissApp.TB.button(1).node();
            }
            catch (e) {
                OdissApp.TB.button().add(1, {
                    text: DTViewAsOneImage(OdissApp.language),
                    action: OdissApp.openSelectedImages
                });
            }
            OdissApp.showHideExport();
        }
        else {
            $("#chkListAll").popover("hide");

            try {
                OdissApp.TB.buttons(1).remove();
            } catch (e) { }
        }
    }
};