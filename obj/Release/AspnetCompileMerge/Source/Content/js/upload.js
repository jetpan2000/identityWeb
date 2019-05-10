var OdissUpload = {
	baseUrl: '/',
	dateFormat: '',
	language: 'en',
	DZ: null,
	start: function () {
		$("#lnkSendAnotherDocument").on('click', function () {
			$('#frmSaveNew').trigger('reset');
			OdissUpload.DZ.removeAllFiles();

			$("#alertEditSuccess").hide();
			$("#tbSubmitDocument").show();
			$("#btnSaveDocument").show();
			$("#boxStep2").show();
		});

		OdissUpload.DZ = new Dropzone(document.body, {
			url: OdissUpload.baseUrl + "presubmit",
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

		/*
        OdissUpload.DZ.on("sending", function (file, xhr, formData) {
            $("#tblSaveContent").show();
            OdissUpload.activateValidator();
            $("#tblSaveContent input[type=text]:first").focus();
        });

        OdissUpload.DZ.on("maxfilesreached", function () {
            $("#tblSaveContent").show();
            OdissUpload.activateValidator();
            $("#tblSaveContent input[type=text]:first").focus();
        });
        */

		OdissUpload.DZ.on("success", function (file, response) {
			$("#TemporaryFileID").val(response);
			$("#TemporaryFileName").val(file.name);
			//
			$("#tblSaveContent").show();
			OdissUpload.activateValidator();
			$("#tblSaveContent input[type=text]:first").focus();
		});

		OdissUpload.DZ.on("error", function (file, message) {
			this.removeFile(file);
		});

		OdissUpload.DZ.on("removedfile", OdissUpload.clearUploadFile);
		/*
        OdissUpload.DZ.on("error", OdissUpload.clearUploadFile);


        OdissUpload.DZ.on("maxfilesexceeded", function (file) {
            this.removeAllFiles();
            this.addFile(file);
        });*/

		$("#tmpSubmitForm").trigger('submit');
	},

	clearUploadFile: function (file, errorMessage, xhr) {
		if (this.files.length == 0) {
			$.post(OdissUpload.baseUrl + 'CleanSubmit', $("#frmSaveNew").serialize())
                .done(function (data) {

                });

			$("#TemporaryFileID").val('');
			$("#TemporaryFileName").val('');
			$("#tblSaveContent").hide();
			OdissUpload.deactivateValidator();
		}
	},

	activateValidator: function () {
		$('#frmSaveNew').validator().on('submit', function (e) {
			if (e.isDefaultPrevented()) {
				e.preventDefault();
			} else {
				e.preventDefault();
				$("#alertEditSuccess, #alertEditError").hide();
				$.post(OdissUpload.baseUrl + 'submit', $("#frmSaveNew").serialize())
                    .done(function (data) {
                    	if (data.status.Key) {
                    		$("#alertEditSuccess").show();
                    		$("#tbSubmitDocument").hide();
                    		$("#btnSaveDocument").hide();
                    		$("#boxStep2").hide();
                    		setTimeout(function () {
                    			window.parent.$("#frmDocuments").submit(); // Resubmit the parent form, to show updated fields
                    		}, 2500);
                    	}
                    	else {
                    		$("#alertEditError").show();
                    	}
                    });
			}
		});
	},

	deactivateValidator: function () {
		$("#frmSaveNew").validator('destroy');
	}
};