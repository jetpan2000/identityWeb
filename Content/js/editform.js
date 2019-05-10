var OdissEditForm = {
    allowExport: false,
    TB: null,
    baseUrl: null,
    language: 'en',
    groupByPos: '',
    drawed: false,
    maxPerPage: 50,
    useAjax: false,
    NotesCache: {},
    TBConfig: {},
    emptyColumn: '',
    notesTitle: '',
    start: function () {
        moment.locale(OdissEditForm.language);

        $('.form-group-date-range').daterangepicker({
            "showWeekNumbers": true,
            linkedCalendars: false,
            ranges: DRPRanges(OdissEditForm.language),
            autoUpdateInput: false,
            locale: DRPLocale(OdissEditForm.language)
        });

        $('.form-group-date-range').on('apply.daterangepicker', function (ev, picker) {
            $(this).find('input').val(picker.startDate.format(OdissBase.dateFormat) + ' - ' + picker.endDate.format(OdissBase.dateFormat));
        });

        $('.form-group-date-range').on('cancel.daterangepicker', function (ev, picker) {
            $(this).find('input').val('');
        });

        $("#btnResetSearch").on('click', function () {
            window.location.href = OdissEditForm.baseUrl;
        });

        //
        if (OdissEditForm.useAjax) {
            $("#frmDocuments").on('submit', function (e) {
                e.preventDefault();

                OdissEditForm.TB.ajax.reload();
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

        if (OdissEditForm.allowExport)
        {
            buttons = [
            {
                extend: 'collection',
                text: DTExport(OdissEditForm.language),
                buttons: ['csv', 'excel', 'pdf']
            }];
        }

        var disableColumnSorting = [0]; // 0 = Checkbox

        if (OdissEditForm.groupByPos != '')
            disableColumnSorting.push(1); // 1 = Column with grouped data

        OdissEditForm.TBConfig = {
            language:DTLocale(OdissEditForm.language),
            dom: 'itBpr',
            //"sDom": '<"row view-filter"<"col-sm-12"<"pull-left"l><"pull-right"p><"clearfix">>>t<"row view-pager"<"col-sm-12"<"text-center"ip>>>',
            "initComplete": function(settings, json) {
                $('#tbDocuments').show();
                if (OdissEditForm.useAjax) {
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
            "pageLength": OdissEditForm.maxPerPage,
            columnDefs: [
                { class: 'checkBoxColumn', targets: 0 },
                { orderable: false, targets: disableColumnSorting }
            ],
            "drawCallback": function (settings) {
                //if (!OdissEditForm.drawed) {
                // Add more functions

                // Group records
                if (OdissEditForm.groupByPos != null && OdissEditForm.groupByPos != '') {
                    var columnToGroup = parseInt(OdissEditForm.groupByPos) + 1; // Add 1 to position because of checkbox
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
                            if (!OdissEditForm.drawed)
                                ungroup.push({ text: $(rows).eq(i).find('td:eq(1)').text().trim(), id: $(rows).eq(i).find('td:eq(1) a').data('id') });
                            $(rows).eq(i).remove();
                        }
                    });
                }
                OdissEditForm.drawed = true;
                //}
            }
        };

        if (OdissEditForm.useAjax)
        {
            OdissEditForm.TBConfig.processing = true;
            OdissEditForm.TBConfig.serverSide = true;
            OdissEditForm.TBConfig.ajax = {
                url: OdissEditForm.baseUrl + '/', type: "POST", data: function (d) {
                    if (OdissEditForm.TB != null) {
                        var order = OdissEditForm.TB.order();
                        if (order != null && order.length > 0) {
                            $("#sort").val(order[0][0] + "," + order[0][1]);
                        }
                    }

                    return $("#frmDocuments").serialize();
                }
            };
            OdissEditForm.TBConfig.columnDefs[0].render = function (data, type, row) { return '<input type="checkbox" data-id="' + row[0] + '" />'; };
            OdissEditForm.TBConfig.columnDefs.push({
                targets: 1, render: function (data, type, row) {
                    var showNotes = row[row.length - 1];
                    var dataId = row[0];
                    var dataVal = row[1];

                    return '<a href class="link-open-document" data-id="' + dataId + '"> ' + (dataVal != null && dataVal != '' ? dataVal : OdissEditForm.emptyColumn) + '</a>' + (showNotes == '1' ? '<a tabindex="0" class="glyphicon glyphicon-file pull-right" style="cursor:normal;color:#F1D18F"></a>' : '');
                }
            });
            OdissEditForm.TBConfig.createdRow = function (row, data, dataIndex) {
                if (data[data.length - 1] == "1") // hasNotes = true
                {
                    $(row).attr('data-placement','left');
                    $(row).attr('data-toggle', 'popover');
                    $(row).attr('data-trigger', 'focus');
                    $(row).attr('data-poload', data[0]); // guid
                    $(row).attr('title', OdissEditForm.notesTitle);
                }
            };
        }

        OdissEditForm.TB = $('#tbDocuments').DataTable(OdissEditForm.TBConfig);

        if (OdissEditForm.useAjax)
        {
            $("#tbDocuments").on('page.dt', function () {
                $("#page").val(OdissEditForm.TB.page.info().page + 1);
            });
        }

        $("#tbDocuments").on('mouseenter', '*[data-poload]', function () {
            var e = $(this);

            e.off('hover');

            var id = e.data('poload');

            if (OdissEditForm.NotesCache[id] == null)
            {
                $.post(OdissEditForm.baseUrl + '/getnotes', { idd: id })
                    .done(function (data) {
                        OdissEditForm.NotesCache[id] = { data: data };
                        OdissEditForm.showNotesPopup(e, data);
                    });
            }
            else
            {
                OdissEditForm.showNotesPopup(e, OdissEditForm.NotesCache[id].data);
            }
        });

        $("#tbDocuments").on('mouseleave', '*[data-poload]', function () {
            $(this).popover('hide');
        });

        $("#tbDocuments").on('click', '.link-open-document', function (e) {

            $("#tbDocuments").find("[data-toggle='popover']").popover('hide');

            e.stopPropagation();
            e.preventDefault();

            if (OdissEditForm.useAjax) {
                var rowData = OdissEditForm.TB.row($(this).parents('tr')).data();

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

            if (OdissEditForm.useAjax) {
                var rowData = OdissEditForm.TB.row($(this).parents('tr')).data();

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

            OdissEditForm.showHideViewAsOneImage();
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

                OdissEditForm.showHideViewAsOneImage();
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

            OdissEditForm.showHideViewAsOneImage();
        });

        $(".autocompletesearch").each(function (i) {
            $("#" + this.id).autocomplete({
                showNoSuggestionNotice: true,
                serviceUrl: OdissEditForm.baseUrl + '/SearchAutoComplete',
                noCache: true,
                params: { appid: OdissEditForm.baseUrl, mapTo: this.id },
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
            errorClass: 'help-block',
            errorElement: 'span',
            highlight: function (element, errorClass, validClass) {
                $(element).parent().addClass('has-error');
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).parent().removeClass('has-error');
            }
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
                OdissEditForm.TB.button(1).node();
            }
            catch (e) {
                OdissEditForm.TB.button().add(1, {
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
                OdissEditForm.TB.buttons(1).remove();
            } catch (e) { }
        }
    }
};

