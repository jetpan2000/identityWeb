var OdissEditViewerBase = {
    baseUrl: '/',
    dateFormat: '',
    language: 'en',
    enableAlertAutoComplete: true,
    viewerType: 0, // 0 = Regular
    DZ: null,
    start: function () {
        $('.form-group-date').not('.disabled').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            ranges: DRPRanges(OdissEditViewerBase.language),
            locale: DRPLocale(OdissEditViewerBase.language)
        });

        Dropzone.autoDiscover = false;
        if ($(".dropzone").length > 0) {

            OdissEditViewerBase.DZ = new Dropzone(document.body, {
                url: OdissEditViewerBase.baseUrl + "presubmit",
                previewsContainer: "#previews",
                clickable: "#clickable",
                maxFiles: 1,
                filesizeBase: 1024,
                maxFilesize: 20,
                parallelUploads: 10,
                addRemoveLinks: {},
                uploadMultiple: false,
                createImageThumbnails: false,
                acceptedFiles: 'application/pdf,.pdf,.tif,.tiff'
            });



            OdissEditViewerBase.DZ.on("success", function (file, response) {
                $("#TemporaryFileID").val(response);
                $("#TemporaryFileName").val(file.name);
                //$("#iDocument")[0].contentWindow.LoadTempFile(response);
                //
                //$("#tblSaveContent").show();
                //OdissEditViewerBase.activateValidator();
                //$("#tblSaveContent input[type=text]:first").focus();

                checkFilesLimits();

            });

            OdissEditViewerBase.DZ.on("error", function (file, message) {
                if (message != "You can not upload any more files.") {
                    this.removeFile(file);
                }
            });

            OdissEditViewerBase.DZ.on("removedfile", function (file, errorMessage, xhr) {

                checkFilesLimits();

                if (this.files.length == 0) {

                    $("#TemporaryFileID").val('');
                    $("#TemporaryFileName").val('');
                    //$("#iDocument")[0].contentWindow.CloseViewer();
                    //$("#tblSaveContent").hide();
                    //OdissEditViewerBase.deactivateValidator();
                }

            });

            OdissEditViewerBase.DZ.on("addedfile", function (file) {
            });

            function checkFilesLimits() {

                if (OdissEditViewerBase.DZ.files.length >= OdissEditViewerBase.DZ.options.maxFiles) {
                    OdissEditViewerBase.DZ.disable();
                    $("#uploadDiv").hide();
                }
                else {
                    OdissEditViewerBase.DZ.enable();
                    $("#uploadDiv").show();
                }

            }

            //OdissEditViewerBase.DZ.on("maxfilesexceeded", function (file) {
            //    this.removeFile(file);
            //});

            if ($("#TemporaryFileName").val() != "") {
                var mockFile = { name: $("#TemporaryFileName").val(), size: 0 };

                OdissEditViewerBase.DZ.files.push(mockFile);
                OdissEditViewerBase.DZ.emit("addedfile", mockFile);
                OdissEditViewerBase.DZ.emit("complete", mockFile);

                checkFilesLimits();
            }

        }

        $('.form-group-date').on('apply.daterangepicker', function (ev, picker) {
            $(this).find('input').val(picker.startDate.format(OdissEditViewerBase.dateFormat));
        });

        $('.form-group-date').on('cancel.daterangepicker', function (ev, picker) {
            $(this).find('input').val('');
        });

        $('.autoCompleteCaller').on('blur', function ()
        {
            if ($(this).val() != $(this).data('prevalue')) {
                $(this).data('prevalue', $(this).val());

                $.post(OdissEditViewerBase.baseUrl + 'AutoComplete', { name: $(this).attr('name'), value: $(this).val() })
                    .done(function (data) {
                        if (data.status) {
                            var result = data.result;

                            for (var i = 0; i < result.length; i++) {
                                var value = result[i].Value;

                                if (typeof value === 'string') {
                                    if (value.indexOf('/Date') != -1) {
                                        value = moment(value).format(OdissEditViewerBase.dateFormat);
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
                            if (OdissEditViewerBase.enableAlertAutoComplete) {
                                if (confirm('Data not found. Do you want to edit the fields?')) {
                                    $('.form-group-date.disabled').daterangepicker({
                                        singleDatePicker: true,
                                        showDropdowns: true
                                    });

                                    $(".isFilledByAutoComplete").removeProp('disabled');
                                    $(".isFilledByAutoComplete:first").focus();

                                    OdissEditViewerBase.enableAlertAutoComplete = false;
                                }
                            }
                        }
                    });
            }
        });

        $(":input[data-dismiss]").on("click", function () {
            window.parent.closeModal();
        });


        $("#btnSaveChanges").on("click", function () {
            $("#frmEditProperties").submit();
        });

        $("#btnDelete").on('click', function () {
            if (confirm("Do you really want to delete?")) {
                $.post(OdissEditViewerBase.baseUrl + 'delete', $("input[name=guid]").serialize())
                    .done(function (data) {
                        if (data.status) {
                            $("#alertDeleteSuccess").show();
                            setTimeout(function () {
                                window.parent.$("#frmDocuments").submit(); // Resubmit the parent form, to show updated fields
                            }, 500);
                        }
                        else {
                            $("#alertEditError").show();
                        }
                    });
            }
        });


        $(document).on('submit', '#frmEditProperties', function (ev) {
            ev.preventDefault();
            $("#alertEditSuccess, #alertEditError").hide();

            //$("#frmEditProperties").serialize()
            $.post(OdissEditViewerBase.baseUrl + 'Edit', $("#frmEditProperties :visible, input[name=guid], input[name=TemporaryFileID], input[name=TemporaryFileName], input[name=hFormType]").serialize())
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
                });
        });

        $(document).on('submit', '#frmEmail', function (ev) {
            ev.preventDefault();
            $("#alertEmailSuccess, #alertEmailError").hide();

            $.post(OdissEditViewerBase.baseUrl + 'Email', $("#frmEmail").serialize())
                .done(function (data) {
                    if (data.status)
                    {
                        $("#frmEmail").hide();
                        $("#alertEmailSuccess").show();
                    }
                    else
                    {
                        $("#alertEmailError").show();
                    }
                });
        });

        $("#tmpForm").trigger('submit');

        $(".note .btn-remove").click(function () {
            var obj = $(this);

            $("#alertNotesSuccess, #alertNotesError").hide();

            if (confirm("Do you really want to delete the note?")) {
                $.post(OdissEditViewerBase.baseUrl + 'DeleteNote', { idNote: obj.data('id') })
                    .done(function (data) {
                        if (data.status) {
                            obj.parent().remove();
                        }
                        else {
                            $("#alertNotesError").show();
                            setTimeout(function () {
                                $("#alertNotesError").hide();
                            }, 3000);
                        }
                    });
            }
        });

        $("#btnSaveNote").click(function () {
            var docid = $(this).data('id');
            var text = $("#txtNote").val();

            $("#alertNotesSuccess, #alertNotesError").hide();

            if (text != '') {
                $.post(OdissEditViewerBase.baseUrl + 'SaveNote', { doc: docid, text: text })
                    .done(function (data) {
                        if (data.status) {
                            $("#lstNotes").prepend('<div class="note">' + data.note.Text + '<br /><strong>Wrote by ' + data.note.Author + ' - right now</strong><button class="btn glyphicon glyphicon-remove btn-danger btn-xs btn-remove" data-id="' + data.note.ID + '" type="button" title="Remove Note"></button></div>');
                            $("#txtNote").val('');
                            $("#alertNotesSuccess").show();
                            setTimeout(function () {
                                $("#alertNotesSuccess").hide();
                            }, 3000);
                        }
                        else {
                            $("#alertNotesError").show();
                            setTimeout(function () {
                                $("#alertNotesError").hide();
                            }, 3000);
                        }
                    });
            }
        });

        //FORM VALIDATION

        $("#frmEditProperties").validate({
        });


        $.validator.addMethod(
            "odissDate",
            function (value, element) {
                if (isNaN(Date.parse(value)))
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }
        );

        function addValidation(inputElements)
        {

            for (var i = 0; i < inputElements.length; i++)
            {

                var elementName = "#" + inputElements[i].id;
                var bRequired = $(elementName).data("validateRequired").length > 0;
                var requiredMessage = $(elementName).data("validateRequired");

                var validateMessage = $(elementName).data("validateMessage");

                var isNumber = false;
                var numberValidateMessage = "";

                var isDate = false;
                var dateValidateMessage = "";

                if ($(elementName).data("validateType").indexOf("Number") >= 0)
                {
                    isNumber = true;
                    numberValidateMessage = validateMessage;
                }
                else if ($(elementName).data("validateType").indexOf("DateRange") >= 0)
                {
                    isDate= true;
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
            for (var i = 0; i < inputElements.length; i++)
            {
                var elementName = "#" + inputElements[i].id;
                $(elementName).rules("remove");
            }
        }

        addValidation($(":input[data-validate-type]"));

        removeValidation($(".itemToAdd :input[data-validate-type]"));

        //END FORM VALIDATION

    }


};
