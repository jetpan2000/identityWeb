var OdissSubmitBase = {
    baseUrl: '/',
    baseUrlCustomSubmit: 'Submit',
    dateFormat: '',
    language: 'en',
    enableAlertAutoComplete: true,
    DZ: null,
    start: function () {
        var drpLocale = DRPLocale(OdissSubmitBase.language);
        drpLocale.format = OdissSubmitBase.dateFormat;

        $('.form-group-date').not('.disabled').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            ranges: DRPRanges(OdissSubmitBase.language),
            locale: drpLocale
        });

        $('.form-group-date').on('apply.daterangepicker', function (ev, picker) {
            $(this).find('input').val(picker.startDate.format(OdissSubmitBase.dateFormat));
        });

        $('.form-group-date').on('cancel.daterangepicker', function (ev, picker) {
            $(this).find('input').val('');
        });

        $("#lnkSendAnotherDocument").on('click', function () {
            $('#frmSaveNew').trigger('reset');
            OdissSubmitBase.DZ.removeAllFiles();

            $("#alertEditSuccess").hide();
            $("#tbSubmitDocument").show();
            $("#btnSaveDocument").show();
        });

        $('.autoCompleteCaller').on('blur', function () {
            if ($(this).val() != $(this).data('prevalue')) {
                $(this).data('prevalue', $(this).val());

                $.post(OdissSubmitBase.baseUrl + 'AutoComplete', { name: $(this).attr('name'), value: $(this).val() })
                    .done(function (data) {
                        if (data.status) {
                            var result = data.result;

                            for (var i = 0; i < result.length; i++) {
                                var value = result[i].Value;

                                if (typeof value === 'string') {
                                    if (value.indexOf('/Date') != -1) {
                                        value = moment(value).format(OdissSubmitBase.dateFormat);
                                    }
                                }

                                $("[name='" + result[i].Key + "'].isFilledByAutoComplete")
                                    .val(value) // Set value
                                    .css({ backgroundColor: '#ffff99' })
                                    .animate({ opacity: "0.5", backgroundColor: '#fff' }, 300, function () { // Highlight effect
                                        $(this).css({ opacity: '', backgroundColor: '' });
                                    });
                            }
                        }
                        else {
                            if (OdissSubmitBase.enableAlertAutoComplete) {
                                if (confirm(Words.Viewer_AutoComplete_DataNotFound)) {
                                    $('.form-group-date.disabled').daterangepicker({
                                        singleDatePicker: true,
                                        showDropdowns: true
                                    });

                                    $(".isFilledByAutoComplete").removeProp('disabled');
                                    $(".isFilledByAutoComplete:first").focus();

                                    OdissSubmitBase.enableAlertAutoComplete = false;
                                }
                            }
                        }
                    });
            }
        });

        Dropzone.autoDiscover = false;
        OdissSubmitBase.DZ = new Dropzone(document.body, {
            url: OdissSubmitBase.baseUrl + "presubmit",
            previewsContainer: "#previews",
            clickable: "#clickable",
            maxFiles: 1,
            filesizeBase: 1024,
            maxFilesize: 20,
            parallelUploads: 10,
            addRemoveLinks:{},
            uploadMultiple: false,
            createImageThumbnails:false,
            acceptedFiles: 'application/pdf,.pdf,.tif,.tiff'
        });

        /*
        OdissSubmitBase.DZ.on("sending", function (file, xhr, formData) {
            $("#tblSaveContent").show();
            OdissSubmitBase.activateValidator();
            $("#tblSaveContent input[type=text]:first").focus();
        });

        OdissSubmitBase.DZ.on("maxfilesreached", function () {
            $("#tblSaveContent").show();
            OdissSubmitBase.activateValidator();
            $("#tblSaveContent input[type=text]:first").focus();
        });
        */

        OdissSubmitBase.DZ.on("success", function (file, response) {
            $("#TemporaryFileID").val(response);
            $("#TemporaryFileName").val(file.name);
            $("#iDocument")[0].contentWindow.LoadTempFile(response);
            //
            $("#tblSaveContent").show();
            OdissSubmitBase.activateValidator();
            $("#tblSaveContent input[type=text]:first").focus();

            var fieldSettings = JSON.parse($('#customFormFieldsSettings').html());
            OdissSubmitBase.addFieldsRestrictions(fieldSettings);
        });

        OdissSubmitBase.DZ.on("error", function (file, message) {
            this.removeFile(file);
        });

        OdissSubmitBase.DZ.on("removedfile", OdissSubmitBase.clearUploadFile);
        /*
        OdissSubmitBase.DZ.on("error", OdissSubmitBase.clearUploadFile);


        OdissSubmitBase.DZ.on("maxfilesexceeded", function (file) {
            this.removeAllFiles();
            this.addFile(file);
        });*/

        $("#tmpSubmitForm").trigger('submit');
    },

    clearUploadFile : function (file, errorMessage, xhr)
    {
        if (this.files.length == 0) {
            $.post(OdissSubmitBase.baseUrl + 'CleanSubmit', $("#frmSaveNew").serialize())
                .done(function (data) {

                });

            $("#TemporaryFileID").val('');
            $("#TemporaryFileName").val('');
            $("#iDocument")[0].contentWindow.CloseViewer();
            $("#tblSaveContent").hide();
            OdissSubmitBase.deactivateValidator();
        }
    },

    activateValidator: function () {
        $('#frmSaveNew').validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
                e.preventDefault();
            } else {
                e.preventDefault();
                $("#alertEditSuccess, #alertEditError").hide();

                // validate form input here according to fields settings
                var strfieldSettings = $('#customFormFieldsSettings').html();
                var fieldSettings = JSON.parse(strfieldSettings);
                console.log(fieldSettings);

                var validateMessage = OdissSubmitBase.validateFormInputs(fieldSettings);
                if (validateMessage !== "") {
                    $("#alertEditError").show();
                    $("#lbl_errorDetails").html(validateMessage);
                    return;
                }

                $.post(OdissSubmitBase.baseUrl + OdissSubmitBase.baseUrlCustomSubmit, $("#frmSaveNew").serialize())
                    .done(function (data) {
                        if (data.status && data.status.Key) {
                            $("#alertEditSuccess").show();
                            $("#tbSubmitDocument").hide();
                            $("#btnSaveDocument").hide();
                            $("#frmSaveNew").find("input:not(:disabled), select:not(:disabled), textarea:not(:disabled)").prop("disabled", true);

                            setTimeout(function () {
                                window.parent.$("#frmDocuments").submit(); // Resubmit the parent form, to show updated fields
                            }, 2500);
                        }
                        else {
                            $("#alertEditError").show();
                            $("#lbl_errorDetails").html(data.status.Value);
                        }
                    });
            }
        });
    },

    addFieldsRestrictions: function (fieldSettings) {
        var vendorNameInputId = '';
        $.each(fieldSettings, function (key, value) {
            if (value.Name === 'Vendor Name') {
                vendorNameInputId = value.ID;
            }
        });

        $.each(fieldSettings, function (key, value) {
            if (!value.NotVisible && value.Editable) {
                if (value.MaxLen > 0) {
                    $("#" + value.ID).attr('maxlength', value.MaxLen);
                }

                if (value.Type === 1) {// Number
                    if (value.Format === 'C') { // currency
                        $('#' + value.ID).mask("#9999999999.00");
                    }
                    else {
                        $('#' + value.ID).mask("#9999999999");
                    }
                }
                else if (value.Type === 3) { // todo: add date mask?
                }

                if (value.Name === 'Site') { // hard code elelemt for now, will make it completely configurable later
                    OdissSubmitBase.attachAutoComplete('site', $('#' + value.ID), '');
                }
                else if (value.Name === 'Vendor') {
                    OdissSubmitBase.attachAutoComplete('vendor', $('#' + value.ID), vendorNameInputId);
                }
            }
            else {
                $("#" + value.ID).prop('readonly', true);
            }
        });
    },

    validateFormInputs: function (fieldSettings) {
        var ret = "";
        $.each(fieldSettings, function (key, value) {
            if (!value.NotVisible && value.Editable) {
                var inputValue = $('#' + value.ID).val().trim();

                if (value.MaxLen > 0 && inputValue.length > value.MaxLen) {
                    ret += "Max length for " + value.Name + " is " + value.MaxLen + "<br/>";
                }

                if (value.Type === 1) {// Number
                    if (inputValue !== '' && !$.isNumeric(inputValue)) {
                        ret += "Please enter a valid number for " + value.Name + "<br/>";
                    }
                }
                else if (value.Type === 3 && inputValue !== '') { // date input
                    if (!moment(inputValue, OdissSubmitBase.dateFormat).isValid()) {
                        ret += "Please enter a valid date for " + value.Name + "<br/>";
                    }
                }
            }
        });
        return ret;
    },

    deactivateValidator: function () {
        $("#frmSaveNew").validator('destroy');
    },

    attachAutoComplete: function (type, obj, relatedObjId) {
        var url = '';

        if (type === 'site')
            url = OdissSubmitBase.baseUrl + "custom/searchsite";
        else if (type === 'vendor')
            url = OdissSubmitBase.baseUrl + "/custom/searchvendor";
        else
            return;

        $(obj).autocomplete({
            showSuggestionNotice: true,
            serviceUrl: url,
            noCache: true,
            params: { type: type },
            onSelect: function (suggestion) {
                $(this).val(suggestion.data);              

                if (relatedObjId != '') {
                    var desc = $('#' + relatedObjId).val(suggestion.value.substr(suggestion.value.indexOf("-") + 2));
                }
            }
        });
    }
};