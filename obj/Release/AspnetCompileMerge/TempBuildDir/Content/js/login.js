var OdissLogin = {
    baseUrl: '',

    start: function () {
        OdissLogin.checkFrame();

        $(".formlogin input:text").eq(0).focus();

        $(".linkLanguage").click(function () {
            $.post("./change-language", { l: $(this).data('lang') })
                .done(function (data) {
                    if (data.status) {
                        window.location.href = window.location.href;
                    }
                });
        });

        $("#forgotPassword").click(function () {
            $("#EmailAddress").val("");
            $("#errorPanel").hide();
            $("#successPanel").hide();
            $("#resetPasswordModal").modal();
        });

        $("#usernameReminder").click(function () {
            $("#EmailAddressUsernameReminder").val("");
            $("#errorPanelUsernameReminder").hide();
            $("#successPanelUsernameReminder").hide();
            $("#usernameReminderModal").modal();
        });


    },
    isInsideFrame: function () {
        try {
            return window.self !== window.top;
        } catch (e) { return true; }
    },
    checkFrame: function () {
        if (this.isInsideFrame())
            window.top.location.href = OdissBase.baseUrl;
    },
    passwordReset: $(function () {
        $('#formResetPassword').submit(function () {
            $.ajax({
                url: this.action,
                type: this.method,
                data: $(this).serialize(),
                success: function (data) {
                    if (data.status == "error") {
                        $("#errorMessage").text(data.message);
                        $("#errorPanel").show();
                        $("#successPanel").hide();
                    }
                    else
                    {
                        $("#successMessage").text(data.message);
                        $("#successPanel").show();
                        $("#errorPanel").hide();
                    }
                }
            });
            return false;
        });
    }),
    usernameReminder: $(function () {
        $('#formUsernameReminder').submit(function () {
            $.ajax({
                url: this.action,
                type: this.method,
                data: $(this).serialize(),
                success: function (data) {
                    if (data.status == "error") {
                        $("#errorMessageUsernameReminder").text(data.message);
                        $("#errorPanelUsernameReminder").show();
                        $("#successPanelUsernameReminder").hide();
                    }
                    else {
                        $("#successMessageUsernameReminder").text(data.message);
                        $("#successPanelUsernameReminder").show();
                        $("#errorPanelUsernameReminder").hide();
                    }
                }
            });
            return false;
        });
    })
};

$(document).ready(function () {
    OdissLogin.start();
});

