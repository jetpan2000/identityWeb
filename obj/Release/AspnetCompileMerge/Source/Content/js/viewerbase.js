var OdissViewerBase = {
    baseUrl: '/',
    baseWfUrl: '/',
    dateFormat: '',
    language: 'en',
    enableAlertAutoComplete: true,
    viewerType: 0, // 0 = Regular
    customEmailUrl: null,
    isWorkflow: false,
    isIE: function () {
        // At least IE6
        var isIE = /*@cc_on!@*/false || !!document.documentMode;

        // Edge 20+
        var isEdge = !isIE && !!window.StyleMedia;

        return isIE;// || isEdge;
    },
    getEmailUrl: function () {
        if (OdissViewerBase.customEmailUrl)
        {
            return OdissViewerBase.customEmailUrl;
        }
        else
        {
            return OdissViewerBase.baseUrl + 'Email';
        }
    },
    start: function () {
        moment.locale(OdissViewerBase.language);

        var drpLocale = DRPLocale(OdissViewerBase.language);
        drpLocale.format = OdissViewerBase.dateFormat;

        $('.form-group-date').not('.disabled').daterangepicker({
            ranges: DRPRanges(OdissViewerBase.language),
            singleDatePicker: true,
            showDropdowns: true,
            "autoUpdateInput": true,
            locale: drpLocale,
            linkedCalendars: true
        });

        $('.form-group-date').on('apply.daterangepicker', function (ev, picker) {
            $(this).find('input').val(picker.startDate.format(OdissViewerBase.dateFormat));
        });

        $('.form-group-date').on('cancel.daterangepicker', function (ev, picker) {
            $(this).find('input').val('');
        });

        $('.autoCompleteCaller').on('blur', function ()
        {
            var curObj = $(this);

            if (curObj.val() != curObj.data('prevalue')) {
                curObj.data('prevalue', curObj.val());
                curObj.addClass('txtLoading');

                $.post(OdissViewerBase.baseUrl + 'AutoComplete', { name: curObj.attr('name'), value: curObj.val() })
                    .done(function (data) {
                        if (data.status) {
                            var result = data.result;

                            for (var i = 0; i < result.length; i++) {
                                var value = result[i].Value;

                                if (typeof value === 'string') {
                                    if (value.indexOf('/Date') != -1) {
                                        value = moment(value).format(OdissViewerBase.dateFormat);
                                    }
                                }

                                $("[name='" + result[i].Key.toLowerCase() + "'].isFilledByAutoComplete")
                                    .val(value) // Set value
                                    .css({ backgroundColor: '#ffff99' })
                                    .animate({ opacity: "0.5", backgroundColor: '#fff' }, 300, function () { // Highlight effect
                                        $(this).css({ opacity: '', backgroundColor: '' });
                                    });
                            }
                        }
                        else {
                            if (OdissViewerBase.enableAlertAutoComplete) {
                                if (confirm(Words.Viewer_AutoComplete_DataNotFound)) {
                                    $('.form-group-date.disabled').daterangepicker({
                                        singleDatePicker: true,
                                        showDropdowns: true
                                    });

                                    $(".isFilledByAutoComplete").removeProp('readonly');
                                    $(".isFilledByAutoComplete:first").focus();

                                    OdissViewerBase.enableAlertAutoComplete = false;
                                }
                            }
                        }
                    })
                .always(function () {
                    curObj.removeClass('txtLoading');
                });
            }
        });

        /*
        $(".control-filter.autocompletesearch").dblclick(function () {
            try {
                $('#hidden' + this.id).val('');
            }
            catch (e) { }
        });
        */

        $(".autocompletesearch").each(function (i) {
            $("#" + this.id).autocomplete({
                showNoSuggestionNotice: true,
                serviceUrl: OdissViewerBase.baseUrl + '/SearchAutoComplete',
                noCache: true,
                params: { appid: OdissViewerBase.baseUrl, mapTo: this.id },
                onSelect: function (suggestion) {
                    var hiddenElement = "hidden" + this.id;
                    $("#" + hiddenElement).val(suggestion.data);
                    $(this).valid();
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

        $(document).on('submit', '#frmEditProperties', function (ev) {
            ev.preventDefault();
            $("#alertEditSuccess, #alertEditError").hide();

            $.post(OdissViewerBase.baseUrl + 'Edit', $("#frmEditProperties").serialize())
                .done(function (data) {
                    if (data.status)
                    {
                        $("#alertEditSuccess").show();
                        setTimeout(function () {
                            window.parent.$("#frmDocuments").submit(); // Resubmit the parent form, to show updated fields
                        }, 2500);
                    }
                    else
                    {
                        $("#alertEditError").show();
                    }
                })
                .fail(function () {
                    $("#alertEditError").show();
                });
        });

        $(document).on('submit', '#frmEmail', function (ev) {
            ev.preventDefault();
            $("#alertEmailSuccess, #alertEmailError").hide();

            try {
                $("#hidEmailPageFrom").val(OdissViewerBase.getPageFrom());
                $("#hidEmailPageTo").val(OdissViewerBase.getPageTo());
            }
            catch (e) {
                $("#hidEmailPageFrom").val("0");
                $("#hidEmailPageTo").val("0");
            }

            $.post(OdissViewerBase.getEmailUrl(), $("#frmEmail").serialize())
                .done(function (data) {
                    if (data.status)
                    {
                        $("#frmEmail").hide();
                        $("#alertEmailSuccess").show();
                    }
                    else
                    {
                        if (data.ex != null && data.ex != "") {
                            $("#alertEmailError").text(data.ex);
                        }
                        else {
                            $("#alertEmailError").text($("#alertEmailError").data('error'));
                        }

                        $("#alertEmailError").show();
                    }
                })
                .fail(function () {
                    $("#alertEmailError").text($("#alertEmailError").data('error'));
                    $("#alertEmailError").show();
                });
        });

        if ($("#OpenViewer").val() == "False") {
            $("#iDocument").hide();
            $("#iOpenFile").show();
            $("#iOpenFile").attr("src", this.baseUrl + "/ViewerDownload");
        }
        else
        {
            $("#iOpenFile").hide();
            $("#iDocument").show();
            $("#hidCustomUrl").val('');
            $("#hidCustomData").val('');

            OdissViewerBase.customEmailUrl = null;
            $("#frmEmail input[name='email_customurl']").val('');
            $("#frmEmail input[name='email_customdata']").val('');

            $("#tmpForm").trigger('submit');
        }

        function getIframeWindow(iframe_object) {
            var doc;

            if (iframe_object.contentWindow) {
                return iframe_object.contentWindow;
            }

            if (iframe_object.window) {
                return iframe_object.window;
            }

            if (!doc && iframe_object.contentDocument) {
                doc = iframe_object.contentDocument;
            }

            if (!doc && iframe_object.document) {
                doc = iframe_object.document;
            }

            if (doc && doc.defaultView) {
                return doc.defaultView;
            }

            if (doc && doc.parentWindow) {
                return doc.parentWindow;
            }

            return undefined;
        }

        function changePageByViewer(from, to)
        {
            if (OdissViewerBase.viewerType == 'Default') {
                getIframeWindow(document.getElementById("iDocument")).changePage(from, to);
                //getIframeWindow(document.getElementById("iDocument")).changePage(from, to);
            }
            else if (OdissViewerBase.viewerType == 'BrowserNative') {
                changePage(from, to);
            }
            else if (OdissViewerBase.viewerType == 'ByBrowser') {
                if (OdissViewerBase.isIE()) {
                    changePage(from, to);
                }
                else {
                    getIframeWindow(document.getElementById("iDocument")).changePage(from, to);
                }
            }
        }

        function changePage(from, to)
        {
            if (from == 0 && to == 0) {
                // All pages
            }
            else {
                to = to - from + 1;
            }

            $("#hidStartPage").val(from);
            $("#hidEndPage").val(to);
            $("#hidCustomUrl").val('');
            $("#hidCustomData").val('');

            OdissViewerBase.customEmailUrl = null;
            $("#frmEmail input[name='email_customurl']").val('');
            $("#frmEmail input[name='email_customdata']").val('');

            $("#tmpForm").trigger('submit');
        }

        $("#frmPages input").on('change', function () {
            var selValue = $('input[name=radPages]:checked', '#frmPages').val();

            if (selValue == "0") {
                $("#lblPagesAll").css('font-weight', 'bold');
                $("#lblPagesRange").css('font-weight', '');
                changePageByViewer(0, 0);
            }
            else
            {
                $("#lblPagesAll").css('font-weight', '');
                $("#lblPagesRange").css('font-weight', 'bold');

                var valFrom = parseInt($("#cboPageFrom").val());
                var valTo = parseInt($("#cboPageTo").val());

                changePageByViewer(valFrom, valTo);
            }
        });

        $("#cboPageFrom").on('change', function () {
            $("#lblPagesAll").css('font-weight', '');
            $("#lblPagesRange").css('font-weight', 'bold');
            var valFrom = parseInt($("#cboPageFrom").val());
            var valTo = parseInt($("#cboPageTo").val());

            $("#radPagesRange").prop("checked", true);

            if (valFrom > valTo) {
                $("#cboPageTo").val(valFrom);
                valTo = valFrom;
            }

            changePageByViewer(valFrom, valTo);
        });

        $("#cboPageTo").on('change', function () {
            $("#lblPagesAll").css('font-weight', '');
            $("#lblPagesRange").css('font-weight', 'bold');
            var valFrom = parseInt($("#cboPageFrom").val());
            var valTo = parseInt($("#cboPageTo").val());

            $("#radPagesRange").prop("checked", true);

            if (valFrom > valTo) {
                $("#cboPageFrom").val(valTo);
                valFrom = valTo;
            }

            changePageByViewer(valFrom, valTo);
        });

        $("#lstNotes").on('click', '.note .btn-remove', function () {
            var obj = $(this);

            $("#alertNotesSuccess, #alertNotesError").hide();

            var totalNotes = 0;

            try {
                totalNotes = parseInt($("#spanTotalNotes").text());
            }
            catch (e) { }

            if (confirm(Words.Notes_ConfirmDelete)) {
                $.post(OdissViewerBase.baseUrl + 'DeleteNote', { idNote: obj.data('id') })
                    .done(function (data) {
                        if (data.status) {
                            obj.parent().remove();

                            if (totalNotes - 1 > 0) {
                                $("#spanTotalNotes").text(totalNotes - 1);
                            }
                            else
                            {
                                $("#spanTotalNotes").text('');
                            }
                        }
                        else {
                            $("#alertNotesError").show();
                            setTimeout(function () {
                                $("#alertNotesError").hide();
                            }, 3000);
                        }
                    })
                .fail(function () {
                    $("#alertNotesError").show();
                    setTimeout(function () {
                        $("#alertNotesError").hide();
                    }, 3000);
                });
            }
        });

        $("#btnSaveNote").click(function () {
            var docids = $(this).data('id');
            var text = $("#txtNote").val();
            var totalNotes = $("#spanTotalNotes").text();

            $("#alertNotesSuccess, #alertNotesError").hide();

            if (text != '') {
                $.post(OdissViewerBase.baseUrl + 'SaveNote', { docs: docids, text: text })
                    .done(function (data) {
                        if (data.status) {
                            $("#lstNotes").prepend('<div class="note">' + data.note.Text + '<hr style="margin:5px 0px;border-color:#ddd;" /><strong>' + Words.Notes_WroteBy + ' ' + data.note.Author + '</strong><br /><span style="color:#888">' + Words.Notes_WroteSecondsAgo + '</span><button class="btn glyphicon glyphicon-remove btn-danger btn-xs btn-remove" data-id="' + data.note.ID + '" type="button" title="' + Words.Notes_RemoveNote + '"></button></div>');
                            $("#txtNote").val('');
                            $("#alertNotesSuccess").show();
                            setTimeout(function () {
                                $("#alertNotesSuccess").hide();
                            }, 3000);

                            if (totalNotes == '') {
                                $("#spanTotalNotes").text("1");
                            }
                            else
                            {
                                try {
                                    $("#spanTotalNotes").text(parseInt(totalNotes) + 1);
                                } catch (e) { }
                            }
                        }
                        else {
                            $("#alertNotesError").show();
                            setTimeout(function () {
                                $("#alertNotesError").hide();
                            }, 3000);
                        }
                    })
                    .fail(function () {
                        $("#alertNotesError").show();
                        setTimeout(function () {
                            $("#alertNotesError").hide();
                        }, 3000);
                    });
            }
        });

        //FORM VALIDATION
        $("#frmEditProperties").validate({
            errorClass: 'help-block',
            errorElement: 'span',
            highlight: function (element, errorClass, validClass) {
                $(element).parent().addClass('has-error');
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).parent().removeClass('has-error');
            }
        });
        
        $.validator.addMethod("odissDate", function (value, element) {
            if (value && isNaN(Date.parse(value))) {
                return false;
            }
            else {
                return true;
            }
        });

        $.validator.addMethod("regex", function (value, element) {
            var regexValue = $(element).data('validate-regex');

            if (regexValue != '') {
                var validation = new RegExp(regexValue);

                return validation.test(value);
            }

            return true;
        });

        $.validator.addMethod("odissAutoComplete", function (value, element) {
                var hiddenID = $(element).attr('id');
                var hiddenValue = $("#hidden" + hiddenID).val();

                return hiddenValue != '';
            }
        );

        $.validator.addMethod("wfAutoComplete", function (value, element) {
            var hiddenID = $(element).attr('name');
            var hiddenValue = $("#SUB_" + hiddenID).val();

            return hiddenValue != ''
        });

        /*
        function addValidation(inputElements) {

            for (var i = 0; i < inputElements.length; i++) {

                var elementName = inputElements[i];
                var bRequired = $(elementName).data("validateRequired").length > 0;
                var requiredMessage = $(elementName).data("validateRequired");

                var validateMessage = $(elementName).data("validateMessage");

                var isNumber = false;
                var numberValidateMessage = "";

                var isRegex = false;
                var regexValidateMessage = "";

                var isDate = false;
                var dateValidateMessage = "";

                var isAutoComplete = false;
                var autoCompleteValidateMessage = "";

                if ($(elementName).data("validateType").indexOf("Number") >= 0) {
                    isNumber = true;
                    numberValidateMessage = validateMessage;
                }
                else if ($(elementName).data("validateType").indexOf("DateRange") >= 0) {
                    isDate = true;
                    dateValidateMessage = validateMessage;
                }
                else if ($(elementName).data("validateType").indexOf("AutoComplete") >= 0 && bRequired) {
                    isAutoComplete = true;
                    autoCompleteValidateMessage = requiredMessage;
                }
                else if ($(elementName).data('validateRegex') != '') {
                    isRegex = true;
                    regexValidateMessage = validateMessage;
                }

                $(elementName).rules("add", {
                    number: isNumber,
                    odissDate: isDate,
                    required: bRequired,
                    odissAutoComplete: isAutoComplete,
                    regex: isRegex,
                    messages: {
                        number: numberValidateMessage,
                        odissDate: dateValidateMessage,
                        required: requiredMessage,
                        odissAutoComplete: autoCompleteValidateMessage,
                        regex: regexValidateMessage
                    }
                });

            }
        }
        */
        /*
        function removeValidation(inputElements) {
            for (var i = 0; i < inputElements.length; i++) {
                var elementName = "#" + inputElements[i].id;
                $(elementName).rules("remove");
            }
        }
        */

        this.addValidation($(":input[data-validate-type]"));

        //END FORM VALIDATION

        if (OdissViewerBase.isWorkflow)
        {
            var workFlowValidatorObj = null;

            $("a[data-type='wfback']").on('click', function () {
                $("#WFStep1").show();
                $("#WFStep2").hide();

                //$("#stepper1").addClass('active-step editable-step');
            });

            $("#WFStep1 button[data-type='wfaction']").on('click', function () {
                //var current = $(this);
                var current = $("#WFStep1 input[name=wfaction]:checked");

                if (current.length == 0) return;

                var actionName = current.data('title');

                var fields = current.data('fields');
                var actionId = current.data('id');
                var requestActionId = current.data('request-action-id');
                var requestId = current.data('request-id');
                var fieldsPlace = $("#WFStep2_Fields");
                var firstField = null;

                fieldsPlace.empty();

                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    var fieldType = field.FieldTypeId; // 9 = TextArea

                    var formGroup = $("<div class='form-group'/>");
                    var label = $("<label>" + field.Name + "</label>");
                    var htmlField = null;

                    if (fieldType == 2) { // Text
                        htmlField = $('<input type="text" class="form-control" />');
                    }
                    else if (fieldType == 5) {
                        htmlField = $('<select class="form-control" />');

                        if (field.Custom != null && field.Custom.DataSource != null) {
                            htmlField.append('<option value=""></option>');
                            for (var ds = 0; ds < field.Custom.DataSource.length; ds++) {
                                var dataSourceItem = field.Custom.DataSource[ds];

                                htmlField.append('<option value="' + dataSourceItem.Code + '">' + dataSourceItem.Name + '</option>');
                            }
                        }
                    }
                    else if (fieldType == 9) { // TextArea
                        htmlField = $('<textarea class="form-control" rows="5" style="resize:none;">');
                    } else if (fieldType == 10) { // AutoComplete
                        htmlField = $('<input type="text" class="form-control" />');

                        $(htmlField).autocomplete({
                            showNoSuggestionNotice: true,
                            serviceUrl: OdissViewerBase.baseWfUrl + '/autocomplete',
                            noCache: true,
                            params: { actionFieldId: field.ActionFieldId, requestActionid: requestActionId, requestId: requestId },
                            onSelect: function (suggestion) {
                                $("#" + "SUB_" + $(this).attr('name')).val(suggestion.data);
                                $(this).valid();
                            }
                        });

                        var htmlSubField = $('<input type="hidden">');
                        htmlSubField.attr('name', 'SUB_FIELD_' + field.ActionFieldId);
                        htmlSubField.attr('id', 'SUB_FIELD_' + field.ActionFieldId);

                        formGroup.append(htmlSubField);
                    }

                    if (htmlField != null) {
                        htmlField.attr('name', 'FIELD_' + field.ActionFieldId);
                        htmlField.data('id', field.ActionFieldId);

                        htmlField.css('margin-bottom', '10px');

                        if (firstField == null) firstField = htmlField;

                        formGroup.append(label);

                        if (field.Custom != null && field.Custom.IsRequired) {
                            htmlField.attr('required', 'required');
                            formGroup.append($("<span style='color:red;'> *</span>"));

                            if (fieldType == 10) // AutoComplete
                            {
                                htmlField.attr('data-rule-wfAutoComplete', true);
                                htmlField.attr('data-msg-wfAutoComplete', 'You have to select a valid option');
                                htmlField.on('input', function () {
                                    htmlSubField.val('');
                                });
                            }
                        }
                        formGroup.append(htmlField);

                        fieldsPlace.append(formGroup);
                    }
                }

                $("#stepper1").removeClass('editable-step').addClass('step-done');
                $("#stepper2").addClass('active-step editable-step');

                $("#WFStep2 .panel-heading").text(actionName);

                if (workFlowValidatorObj != null)
                    workFlowValidatorObj.destroy();

                workFlowValidatorObj = $("#WFStep2_Form").validate({
                    errorClass: 'help-block',
                    errorElement: 'span',
                    highlight: function (element, errorClass, validClass) {
                        $(element).parent().addClass('has-error');
                    },
                    unhighlight: function (element, errorClass, validClass) {
                        $(element).parent().removeClass('has-error');
                    }
                });

                var buttonExecuteAction = $("#WFStep2").find("[data-type='wfexecute']");
                buttonExecuteAction.text(actionName);
                buttonExecuteAction.data('id', actionId);
                buttonExecuteAction.data('request-action-id', requestActionId);

                buttonExecuteAction.unbind('click');
                buttonExecuteAction.on('click', function () {

                    if (!$("#WFStep2_Form").valid()) return;

                    var idAction = $(this).data('id');
                    var requestActionId = $(this).data('request-action-id');

                    $("#WFStep2_Form input[name='actionId']").val(idAction);
                    $("#WFStep2_Form input[name='requestActionId']").val(requestActionId);

                    $.post(OdissViewerBase.baseWfUrl + 'RunAction', $("#WFStep2_Form").serialize())
                        .done(function (data) {

                            $("#WFStep2").fadeOut("fast", function () {
                                $("#WFStep3").fadeIn("fast", function () {

                                });
                            });

                            $("#stepper2").removeClass('editable-step').addClass('step-done');

                            OdissViewerBase.refreshSearch();
                        });
                });

                $("#WFStep1").fadeOut("fast", function () {
                    $("#WFStep2").fadeIn("fast", function () {
                        if (firstField != null)
                            firstField.focus();
                    });
                });

                //$("#WFStep1").hide();
                //$("#WFStep2").show();
            });
        }
    },

    updateWFRequestStatus: function (status) {
        if (!status) return;

        if (status.Success) {
            $("#WFStepsBox").show();
            $("#WFStepsMessage").hide();
        }
        else {
            $("#WFStepsBox").hide();
            $("#WFStepsMessage").text($("#WFStepsMessage").data('pre-message') + status.ErrorMessage);
            $("#WFStepsMessage").show();
        }
    },

    refreshSearchOnClose: function() {
        window.top.OdissApp.refreshOnClose();
    },

    refreshSearch: function() {
        window.top.OdissApp.refreshSearch();
    },

    addValidation : function(inputElements) {
        for (var i = 0; i < inputElements.length; i++) {

            var elementName = inputElements[i];
            var bRequired = $(elementName).data("validateRequired").length > 0;
            var requiredMessage = $(elementName).data("validateRequired");

            var validateMessage = $(elementName).data("validateMessage");

            var isNumber = false;
            var numberValidateMessage = "";

            var isRegex = false;
            var regexValidateMessage = "";

            var isDate = false;
            var dateValidateMessage = "";

            var isAutoComplete = false;
            var autoCompleteValidateMessage = "";

            if ($(elementName).data("validateType").indexOf("Number") >= 0) {
                isNumber = true;
                numberValidateMessage = validateMessage;
            }
            else if ($(elementName).data("validateType").indexOf("DateRange") >= 0) {
                isDate = true;
                dateValidateMessage = validateMessage;
            }
            else if ($(elementName).data("validateType").indexOf("AutoComplete") >= 0 && bRequired) {
                isAutoComplete = true;
                autoCompleteValidateMessage = requiredMessage;
            }
            else if ($(elementName).data('validateRegex') != '') {
                isRegex = true;
                regexValidateMessage = validateMessage;
            }

            $(elementName).rules("add", {
                number: isNumber,
                odissDate: isDate,
                required: bRequired,
                odissAutoComplete: isAutoComplete,
                regex: isRegex,
                messages: {
                    number: numberValidateMessage,
                    odissDate: dateValidateMessage,
                    required: requiredMessage,
                    odissAutoComplete: autoCompleteValidateMessage,
                    regex: regexValidateMessage
                }
            });

        }
    },

    removeValidation: function(inputElements) {
        for (var i = 0; i < inputElements.length; i++) {
            var elementName = "#" + inputElements[i].id;
            $(elementName).rules("remove");
        }
    },

    getPagesTypes: function () {
        return $('input[name=radPages]:checked', '#frmPages').val(); // 0 = All, Else = Range
    },

    getPageFrom: function () {
        if (OdissViewerBase.getPagesTypes() == "0") return 0;

        return $("#cboPageFrom").val();
    },

    getPageTo: function(){
        if (OdissViewerBase.getPagesTypes() == "0") return 0;

        return $("#cboPageTo").val();
    },

    changeDoc: function(doc) {
        if (!doc)
            $("#hidDoc").val($("#hidDoc").data('original-guids'));
        else
            $("#hidDoc").val(doc);

        $("#frmEmail input[name='docs']").val($("#hidDoc").val());

        $("#hidCustomUrl").val('');
        $("#hidCustomData").val('');

        OdissViewerBase.customEmailUrl = null;
        $("#frmEmail input[name='email_customurl']").val('');
        $("#frmEmail input[name='email_customdata']").val('');

        $("#tmpForm").trigger('submit');
    },

    saveActionDownload: function (docsID) {
        $.post(OdissViewerBase.baseUrl + 'SaveActionDownload', { docs: docsID })
            .done(function (data) {

            });
    },

    saveActionPrint: function (docsID) {
        $.post(OdissViewerBase.baseUrl + 'SaveActionPrint', { docs: docsID })
            .done(function (data) {

            });
    },

    downloadFile: function () {
        $("#tmpOpenFileForm").trigger('submit');
    },

    getHeight: function () {
        return $("#iOpenFile").height();
    },

    getWidth: function () {
        return $("#iOpenFile").width();
    },

    getFileExtension: function(){
        return $("#FileExtension").val();
    },

    reloadViewer: function (startPage, endPage, docs, fileLoad) {
        $("#hidStartPage").val(startPage);
        $("#hidEndPage").val(endPage);
        $("#hidDoc").val(docs);
        $("#hidFileLoad").val(fileLoad);
        $("#hidCustomUrl").val('');
        $("#hidCustomData").val('');
        OdissViewerBase.customEmailUrl = null;
        $("#frmEmail input[name='email_customurl']").val('');
        $("#frmEmail input[name='email_customdata']").val('');
        $("#tmpForm").trigger('submit');
    },

    reloadOriginalViewer: function () {
        $("#hidStartPage").val(0);
        $("#hidEndPage").val(0);
        $("#hidDoc").val($("#hidDoc").data('original-guids'));
        $("#hidFileLoad").val('');
        $("#hidCustomUrl").val('');
        $("#hidCustomData").val('');
        OdissViewerBase.customEmailUrl = null;
        $("#frmEmail input[name='email_customurl']").val('');
        $("#frmEmail input[name='email_customdata']").val('');
        $("#tmpForm").trigger('submit');
    },

    loadCustomViewer: function (url, data, urlEmail) {
        var customData = JSON.stringify(data, null, 0);

        $("#hidCustomUrl").val(url);
        $("#hidCustomData").val(customData);

        // Set email module data

        if (urlEmail) {
            OdissViewerBase.customEmailUrl = urlEmail;
            $("#frmEmail input[name='email_customurl']").val(urlEmail);
            $("#frmEmail input[name='email_customdata']").val(customData);
        }
        else
        {
            OdissViewerBase.customEmailUrl = null;
            $("#frmEmail input[name='email_customurl']").val('');
            $("#frmEmail input[name='email_customdata']").val('');
        }

        $("#tmpForm").trigger('submit');
    },

    addDocId: function(guid, pos)
    {
        var guids = $("#hidDoc").data('original-guids').split(',');

        if (pos != null) {
            guids.splice(pos, 0, guid);
        }
        else {
            guids.push(guid);
        }

        $("#hidDoc").val(guids.join(','));
        $("#hidDoc").data('original-guids', guids.join(','));
    },

    getOriginalGuids: function()
    {
        return $("#hidDoc").data('original-guids');
    }
};