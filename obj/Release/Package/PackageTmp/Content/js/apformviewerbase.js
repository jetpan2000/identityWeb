var OdissAPViewerBase = {
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
            ranges: DRPRanges(OdissAPViewerBase.language),
            locale: DRPLocale(OdissAPViewerBase.language)
        });

        Dropzone.autoDiscover = false;
        if ($(".dropzone").length > 0) {

            OdissAPViewerBase.DZ = new Dropzone(document.body, {
                url: OdissAPViewerBase.baseUrl + "presubmit",
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



            OdissAPViewerBase.DZ.on("success", function (file, response) {
                $("#TemporaryFileID").val(response);
                $("#TemporaryFileName").val(file.name);
                //$("#iDocument")[0].contentWindow.LoadTempFile(response);
                //
                //$("#tblSaveContent").show();
                //OdissAPViewerBase.activateValidator();
                //$("#tblSaveContent input[type=text]:first").focus();

                checkFilesLimits();

            });

            OdissAPViewerBase.DZ.on("error", function (file, message) {
                if (message != "You can not upload any more files.") {
                    this.removeFile(file);
                }
            });

            OdissAPViewerBase.DZ.on("removedfile", function (file, errorMessage, xhr) {

                checkFilesLimits();

                if (this.files.length == 0) {

                    $("#TemporaryFileID").val('');
                    $("#TemporaryFileName").val('');
                    //$("#iDocument")[0].contentWindow.CloseViewer();
                    //$("#tblSaveContent").hide();
                    //OdissAPViewerBase.deactivateValidator();
                }

            });

            OdissAPViewerBase.DZ.on("addedfile", function (file) {
            });

            function checkFilesLimits() {

                if (OdissAPViewerBase.DZ.files.length >= OdissAPViewerBase.DZ.options.maxFiles) {
                    OdissAPViewerBase.DZ.disable();
                    $("#uploadDiv").hide();
                }
                else {
                    OdissAPViewerBase.DZ.enable();
                    $("#uploadDiv").show();
                }

            }

            //OdissAPViewerBase.DZ.on("maxfilesexceeded", function (file) {
            //    this.removeFile(file);
            //});

            if ($("#TemporaryFileName").val() != "") {
                var mockFile = { name: $("#TemporaryFileName").val(), size: 0 };

                OdissAPViewerBase.DZ.files.push(mockFile);
                OdissAPViewerBase.DZ.emit("addedfile", mockFile);
                OdissAPViewerBase.DZ.emit("complete", mockFile);

                checkFilesLimits();
            }

        }

        $('.form-group-date').on('apply.daterangepicker', function (ev, picker) {
            $(this).find('input').val(picker.startDate.format(OdissAPViewerBase.dateFormat));
        });

        $('.form-group-date').on('cancel.daterangepicker', function (ev, picker) {
            $(this).find('input').val('');
        });

        $('.autoCompleteCaller').on('blur', function ()
        {
            if ($(this).val() != $(this).data('prevalue')) {
                $(this).data('prevalue', $(this).val());

                $.post(OdissAPViewerBase.baseUrl + 'AutoComplete', { name: $(this).attr('name'), value: $(this).val() })
                    .done(function (data) {
                        if (data.status) {
                            var result = data.result;

                            for (var i = 0; i < result.length; i++) {
                                var value = result[i].Value;

                                if (typeof value === 'string') {
                                    if (value.indexOf('/Date') != -1) {
                                        value = moment(value).format(OdissAPViewerBase.dateFormat);
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
                            if (OdissAPViewerBase.enableAlertAutoComplete) {
                                if (confirm('Data not found. Do you want to edit the fields?')) {
                                    $('.form-group-date.disabled').daterangepicker({
                                        singleDatePicker: true,
                                        showDropdowns: true
                                    });

                                    $(".isFilledByAutoComplete").removeProp('disabled');
                                    $(".isFilledByAutoComplete:first").focus();

                                    OdissAPViewerBase.enableAlertAutoComplete = false;
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


        $(document).on('submit', '#frmEditProperties', function (ev) {
            ev.preventDefault();
            $("#alertEditSuccess, #alertEditError").hide();

            //$("#frmEditProperties").serialize()
            $.post(OdissAPViewerBase.baseUrl + 'Edit', $("#frmEditProperties :visible, input[name=guid], input[name=TemporaryFileID], input[name=TemporaryFileName], input[name=hFormType]").serialize())
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

            $.post(OdissAPViewerBase.baseUrl + 'Email', $("#frmEmail").serialize())
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
                $.post(OdissAPViewerBase.baseUrl + 'DeleteNote', { idNote: obj.data('id') })
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
                $.post(OdissAPViewerBase.baseUrl + 'SaveNote', { doc: docid, text: text })
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

        function calculateTotal() {
            var total = 0;
            var amounts = $("[name*='__Amount__'], [name*='__amount__']");
            var quantities = $("[name*='__Quantity__'], [name*='__Quantity__']");

            for (var i = 0; i < amounts.length; i++) {
                var totalLine = 0;
                try {
                    var totalCalc = $("#" + amounts[i].name + "").val() * $("#" + quantities[i].name + "").val();
                    if (!isNaN(totalCalc)) {
                        totalLine = totalCalc;
                        total += totalLine;
                    }
                }
                catch (err) {
                }

                $("#totalLine" + amounts[i].name.split("__")[amounts[i].name.split("__").length - 1]).text(totalLine.toFixed(2));
            }

            var taxes = 0.00;
            if (!isNaN($("[title='GST']").val())) { taxes += $("[title='GST']").val() * 1; }
            if (!isNaN($("[title='HST']").val())) { taxes += $("[title='HST']").val() * 1; }
            if (!isNaN($("[title='PST']").val())) { taxes += $("[title='PST']").val() * 1; }
            if (!isNaN($("[title='QST']").val())) { taxes += $("[title='QST']").val() * 1; }

            $("#lblTotalAll").text(total.toFixed(2));
            //$("#lblTotalDocument").text((total + taxes).toFixed(2));
            $("#lblTotalDocument").val((total + taxes).toFixed(2));
        }

        $('.addRow').on('click', function () {
            var iMaxItem = 99;
            for (var i = iMaxItem; i >= 0; i--) {
                itemName = '#item' + i;
                if ($(itemName).is(":visible")) {
                    break;
                }
                else {
                    iMaxItem = i;
                }
            }

            itemName = '#item' + iMaxItem;
            $(itemName).show();

           var elementstoValidate = $(itemName + " [data-validate-type]");
           addValidation(elementstoValidate);


        });

        $('.removeRow').on('click', function (ev) {
            var itemName = '#' + ev.target.parentElement.parentElement.id;

            var itemNumber = ev.target.parentElement.parentElement.id.replace("item", "");

            var quantityInput = $("[name='__item__Quantity__in__" + itemNumber + "'], [name='__item__Quantity__in__" + itemNumber + "']");
            var amountInput = $("[name='__item__Amount__in__" + itemNumber + "'], [name='__item__Amount__in__" + itemNumber + "']");

            quantityInput.val("");
            amountInput.val("");

            $(itemName).hide();

            calculateTotal();
        });

        $(document).on('blur', "[name*='__Quantity__'], [name*='__Quantity__'], [name*='__Amount__'], [name*='__amount__']", function () {
            calculateTotal();
        });

        calculateTotal();

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
