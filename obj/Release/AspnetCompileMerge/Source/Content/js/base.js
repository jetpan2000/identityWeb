var lang = '';

var OdissBase = {
    baseUrl: '/',
    dateFormat: 'MM/dd/yyyy',
    showingDisconnectedWindow: false,
    start: function () {
        //$(document).ready(function () {
            OdissBase.setTotalRowsBadge();
        //});
    },
    setTotalRowsBadge: function () {
        var totalRowsBadge = $("a[data-application-badge=1]");

        if (totalRowsBadge.length !== 0) {
            for (var i = 0; i < totalRowsBadge.length; i++) {
                var appid = $(totalRowsBadge[i]).data("application-id");
                var badge = $(totalRowsBadge[i]).find("[class='badge']");
                var active = $(totalRowsBadge[i]).parent().hasClass('active');

                if (!active) {
                    $.get("./app/" + appid + "/TotalRowsBadge")
                        .done(function (data) {
                            if (data != null && data != 0 && $.isNumeric(data)) {
                                badge.fadeIn();
                                badge.text(data);
                            }
                        });
                }
            }
        }
    },
    savePassword: function () {
        $.post("./auth/savepassword", { currentP: $("#txtCPCurrentPassword").val(), newP: $("#txtCPNewPassword").val(), confirmP: $("#txtCPConfirmNewPassword").val(), __RequestVerificationToken: $("[name='__RequestVerificationToken']").val() })
            .done(function (data) {
                if (data.status)
                {
                    $("#boxMainChangePassword").hide();
                    $("#boxSuccessChangePassword").show();
                    $("#spanSuccessChangePassword").text(data.message);
                    $("#boxErrorChangePassword").hide();
                    $("#btnChangePassword").hide();
                }
                else
                {
                    $("#spanErrorChangePassword").html(data.ex);
                    $("#boxErrorChangePassword").show();
                }
            });
    },
    showDisconnected: function () {
        if (!OdissBase.showingDisconnectedWindow)
        {
            $("#modSessionDisconnected").modal();

            $('#modSessionDisconnected').on('hidden.bs.modal', function (e) {
                OdissBase.signInAgain();
            });

            OdissBase.showingDisconnectedWindow = true;
        }
    },
    signInAgain: function () {
        window.location.href = window.location.href;
    }
};

function hasFlag(flags, flag)
{
    return (flags & flag) == flag;
}

$(document).ready(function () {

    $("#btnSignInAgain").click(function () {
        OdissBase.signInAgain();
    });

    $("#btnChangePassword").on('click', OdissBase.savePassword);
});