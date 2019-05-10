var OdissAPForm = {
    allowExport: false,
    TB: null,
    baseUrl: null,
    language: 'en',
    groupByPos: '',
    drawed: false,
    maxPerPage: 10,
    useAjax: false,
    NotesCache: {},
    TBConfig: {},
    emptyColumn: '',
    notesTitle: '',
    start: function () {
        moment.locale(OdissAPForm.language);

        $('.form-group-date-range').daterangepicker({
            "showWeekNumbers": true,
            linkedCalendars: false,
            ranges: DRPRanges(OdissAPForm.language),
            autoUpdateInput: false,
            locale: DRPLocale(OdissAPForm.language)
        });

        $('.form-group-date-range').on('apply.daterangepicker', function (ev, picker) {
            $(this).find('input').val(picker.startDate.format(OdissBase.dateFormat) + ' - ' + picker.endDate.format(OdissBase.dateFormat));
        });

        $('.form-group-date-range').on('cancel.daterangepicker', function (ev, picker) {
            $(this).find('input').val('');
        });

        $("#btnResetSearch").on('click', function () {
            window.location.href = OdissAPForm.baseUrl;
        });

        //
        if (OdissAPForm.useAjax) {
            $("#frmDocuments").on('submit', function (e) {
                e.preventDefault();

                OdissAPForm.TB.ajax.reload();
            });
        }
        else
        {


        }

        $(".control-filter").dblclick(function () {
            $(this).val('');
        });

        $(".radioListSelect input[type=radio]").change(function () {
            if ($(this).is(":checked"))
            {
                // Hide all Selects
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
        })/*.on('search.jstree', function (e, val) {
            var obj = $(this);
            $.each(val.nodes, function (index, value) {
                obj.jstree(true).select_node(value);
            });
        })*/;

        var to = false;
        $(".form-search-tree").keyup(function () {
            var obj = $(this);

            if (to) { clearTimeout(to); }

            to = setTimeout(function ()
            {
                var v = $(obj).val();
                $(obj).next('.form-control-tree').jstree(true).search(v);
            }, 250);
        });

        var buttons = [];

        if (OdissAPForm.allowExport)
        {
            buttons = [
            {
                extend: 'collection',
                text: DTExport(OdissAPForm.language),
                buttons: ['csv', 'excel', 'pdf']
            }];
        }

        var disableColumnSorting = [0]; // 0 = Checkbox

        if (OdissAPForm.groupByPos != '')
            disableColumnSorting.push(1); // 1 = Column with grouped data

        OdissAPForm.TBConfig = {
            language:DTLocale(OdissAPForm.language),
            dom: 'itBpr',
            //"sDom": '<"row view-filter"<"col-sm-12"<"pull-left"l><"pull-right"p><"clearfix">>>t<"row view-pager"<"col-sm-12"<"text-center"ip>>>',
            "initComplete": function(settings, json) {
                $('#tbDocuments').show();
                if (OdissAPForm.useAjax) {
                    $("#page").val(1); // Set to load the pages. Page = 1
                }

                var rowsFound = this.fnGetData().length;

                if (rowsFound == 0)
                {

                }
            },
            "aaSorting": [], // Disable automatic order
            responsive: true,
            conditionalPaging: true,
            buttons: buttons,
            autoWidth: true,
            //"pageLength": OdissAPForm.maxPerPage,
            columnDefs: [
                { class: 'checkBoxColumn', targets: 0 },
                { orderable: false, targets: disableColumnSorting }
            ],
            "drawCallback": function (settings) {
                //if (!OdissAPForm.drawed) {
                // Add more functions

                // Group records
                if (OdissAPForm.groupByPos != null && OdissAPForm.groupByPos != '') {
                    var columnToGroup = parseInt(OdissAPForm.groupByPos) + 1; // Add 1 to position because of checkbox
                    var api = this.api();
                    var rows = api.rows({ page: 'all' }).nodes();
                    var last = null;
                    var ungroup = [];

                    api.columns().data().each(function (group, i) {
                        var curGroup = $(rows).eq(i).find('td:eq(' + columnToGroup + ')').text();

                        if ($(rows).eq(i + 1) != null && $(rows).eq(i + 1).find('td:eq(' + columnToGroup + ')').text() != curGroup) {
                            if (ungroup.length > 0) {
                                ungroup.push({ text: $(rows).eq(i).find('td:eq(1)').text().trim(), id: $(rows).eq(i).find('td:eq(1) a').data('id') });
                                //$(rows).eq(i).find('td:eq(0)').html('<span class="btnExpand">+</span>');
                                $(rows).eq(i).find('td:eq(0)').html('');
                                $(rows).eq(i).find('td:eq(1)').html('');
                                $(ungroup).each(function (ind, val) {
                                    $(rows).eq(i).find('td:eq(0)').append('<input type="checkbox" data-id="' + val.id + '">');
                                    $(rows).eq(i).find('td:eq(1)').append('<a href="#" style="display:table;margin-bottom:2px;" class="link-open-document" data-id="' + val.id + '">' + val.text + '</a>');//.html(ungroup);
                                });
                            }
                            ungroup = [];
                        }
                        else {
                            if (!OdissAPForm.drawed)
                                ungroup.push({ text: $(rows).eq(i).find('td:eq(1)').text().trim(), id: $(rows).eq(i).find('td:eq(1) a').data('id') });
                            $(rows).eq(i).remove();
                        }
                    });
                }
                OdissAPForm.drawed = true;
                //}
            }
        };

        if (OdissAPForm.useAjax)
        {
            OdissAPForm.TBConfig.processing = true;
            OdissAPForm.TBConfig.serverSide = true;
            OdissAPForm.TBConfig.ajax = {
                url: OdissAPForm.baseUrl + '/', type: "POST", data: function (d) {
                    if (OdissAPForm.TB != null) {
                        var order = OdissAPForm.TB.order();
                        if (order != null && order.length > 0) {
                            $("#sort").val(order[0][0] + "," + order[0][1]);
                        }
                    }

                    return $("#frmDocuments").serialize();
                }
            };
            OdissAPForm.TBConfig.columnDefs[0].render = function (data, type, row) { return '<input type="checkbox" data-id="' + row[0] + '" />'; };
            OdissAPForm.TBConfig.columnDefs.push({
                targets: 1, render: function (data, type, row) {
                    var showNotes = row[row.length - 1];
                    var dataId = row[0];
                    var dataVal = row[1];

                    return '<a href class="link-open-document" data-id="' + dataId + '"> ' + (dataVal != null && dataVal != '' ? dataVal : OdissAPForm.emptyColumn) + '</a>' + (showNotes == '1' ? '<a tabindex="0" class="glyphicon glyphicon-file pull-right" style="cursor:normal;color:#F1D18F"></a>' : '');
                }
            });
            OdissAPForm.TBConfig.createdRow = function (row, data, dataIndex) {
                if (data[data.length - 1] == "1") // hasNotes = true
                {
                    $(row).attr('data-placement','left');
                    $(row).attr('data-toggle', 'popover');
                    $(row).attr('data-trigger', 'focus');
                    $(row).attr('data-poload', data[0]); // guid
                    $(row).attr('title', OdissAPForm.notesTitle);
                }
            };
        }

        OdissAPForm.TB = $('#tbDocuments').DataTable(OdissAPForm.TBConfig);

        if (OdissAPForm.useAjax)
        {
            $("#tbDocuments").on('page.dt', function () {
                $("#page").val(OdissAPForm.TB.page.info().page + 1);
            });
        }

        $("#tbDocuments").on('mouseenter', '*[data-poload]', function () {
            var e = $(this);

            e.off('hover');

            var id = e.data('poload');

            if (OdissAPForm.NotesCache[id] == null)
            {
                $.post(OdissAPForm.baseUrl + '/getnotes', { idd: id })
                    .done(function (data) {
                        OdissAPForm.NotesCache[id] = { data: data };
                        OdissAPForm.showNotesPopup(e, data);
                    });
            }
            else
            {
                OdissAPForm.showNotesPopup(e, OdissAPForm.NotesCache[id].data);
            }
        });

        $("#tbDocuments").on('mouseleave', '*[data-poload]', function () {
            $(this).popover('hide');
        });

        $("#tbDocuments").on('click', '.link-open-document', function (e) {

            $("#tbDocuments").find("[data-toggle='popover']").popover('hide');

            e.stopPropagation();
            e.preventDefault();

            if (OdissAPForm.useAjax) {
                var rowData = OdissAPForm.TB.row($(this).parents('tr')).data();

                $("#hidDoc").val(rowData[0]);
            }
            else {

                $("#hidDoc").val($(this).data('id'));
            }

            $("#tmpForm").trigger('submit');
            $("#modDocument").modal();
        });

        $("#tbDocuments").on('click', '.button-create-document', function (e) {
            e.stopPropagation();
            e.preventDefault();

            if (OdissAPForm.useAjax) {
                var rowData = OdissAPForm.TB.row($(this).parents('tr')).data();

                $("#hidDocButton").val(rowData[0]);
            }
            else {

                $("#hidDocButton").val($(this).data('id'));
            }

            $("#tmpFormButton").trigger('submit');
            $("#modDocument").modal();
        });

        $("#btnSubmitDocument").on('click', function (e) {
            e.stopPropagation();
            e.preventDefault();

            //$("#hidDoc").val($(this).data('id'));
            $("#tmpSubmitForm").trigger('submit');

            //$("#modSubmitDocument").modal();
            $("#modDocument").modal();
        });

        window.closeModal = function() {
            $('#modDocument').modal('hide');
        };

        $('#tbDocuments tbody').on('click', 'tr', function (e) {
            if (e.target.type == 'checkbox') {

                if ($(this).find('input:checkbox:checked').length == $(this).find('input:checkbox').length)
                {
                    if (!$(this).hasClass('info')) {
                        $(this).addClass('info');
                        $(this).find('input:checkbox').prop('checked', true);
                    }
                }
                else
                {
                    if ($(this).hasClass('info')) {
                        $(this).removeClass('info');
                        $(this).find('input:checkbox').prop('checked', false);
                    }
                }

                e.stopPropagation();
            }
            else if (e.target.className != null && e.target.className.indexOf('link-open-document') != -1) // Nice gambi.
            {
                // Do nothing
            }
            else {
                if ($(this).parent().prop('tagName') != 'THEAD') {
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

            OdissAPForm.showHideViewAsOneImage();
        });

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

                OdissAPForm.showHideViewAsOneImage();
            });
        }

        $("#tbDocuments input[id!='chkListAll']:checkbox").click(function () { // All except 'Check all'
            var closestTr = $(this).find('tr');
            if (closestTr.hasClass('info'))
            {
                closestTr.removeClass('info');
            }
            else
            {
                closestTr.addClass('info');
            }

            OdissAPForm.showHideViewAsOneImage();
        });

        $(".autocompletesearch").each(function (i) {
            $("#" + this.id).autocomplete({
                showNoSuggestionNotice: true,
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

        //FORM VALIDATION

        $("#frmDocuments").validate({            
                //errorPlacement: function (error, element) {
                //    if (element && (element.data("validateType").indexOf("DateRange") >= 0)) {
                //        var parent = $(element).siblings('.glyphicon-calendar');
                //        element.insertAfter(parent);
                //    }
                //}
        });

        $.validator.addMethod(
            "odissDate",
            function (value, element) {
                if (value && isNaN(Date.parse(value))) {
                    return false;
                }
                else {
                    return true;
                }
            }
        );

        function addValidation(inputElements) {

            for (var i = 0; i < inputElements.length; i++) {

                var elementName = "#" + inputElements[i].id;
                var bRequired = $(elementName).data("validateRequired").length > 0;
                var requiredMessage = $(elementName).data("validateRequired");

                var validateMessage = $(elementName).data("validateMessage");

                var isNumber = false;
                var numberValidateMessage = "";

                var isDate = false;
                var dateValidateMessage = "";

                if ($(elementName).data("validateType").indexOf("Number") >= 0) {
                    isNumber = true;
                    numberValidateMessage = validateMessage;
                }
                else if ($(elementName).data("validateType").indexOf("DateRange") >= 0) {
                    isDate = true;
                    dateValidateMessage = validateMessage;
                }

                $(elementName).rules("add", {
                    number: isNumber,
                    odissDate: isDate,
                    required: bRequired,
                    messages: {
                        number: numberValidateMessage,
                        odissDate: dateValidateMessage,
                        required: requiredMessage
                    }
                });

            }
        }

        function removeValidation(inputElements) {
            for (var i = 0; i < inputElements.length; i++) {
                var elementName = "#" + inputElements[i].id;
                $(elementName).rules("remove");
            }
        }

        addValidation($(":input[data-validate-type]"));

        //END FORM VALIDATION
    },
    showNotesPopup: function (popObj, data) {
        popObj.popover({ html: true, trigger: "hover", content: data, delay: { show: "500" } }).popover('toggle');
    },
    showHideViewAsOneImage : function ()
    {
        var totalSelected = $("#tbDocuments input[id!='chkListAll']:checked").length;

        if (totalSelected > 1) // Two or more selected, show 'View as one image'
        {
            try {
                OdissAPForm.TB.button(1).node();
            }
            catch (e) {
                OdissAPForm.TB.button().add(1, {
                    text: 'View as one image', action: function () {
                        var ids = [];

                        $("#tbDocuments input[id!='chkListAll']:checked").each(function (index, value) {
                            ids.push($(this).data('id'));
                        });

                        $("#hidDoc").val(ids);
                        $("#tmpForm").trigger('submit');

                        $("#modDocument").modal();
                    }
                });
            }
        }
        else {
            try {
                OdissAPForm.TB.buttons(1).remove();
            } catch (e) { }
        }
    }
};

