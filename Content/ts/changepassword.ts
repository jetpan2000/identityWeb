//declare var $: any;

//class ChangePassword {
//    private static Id_btnChangePassword: string = "#btnChangePassword";

//    public static Init(): void {
//        $(this.Id_btnChangePassword).on('click', this.Save);
//    }

//    public static Save(): void {
//        $.post("./auth/savepassword", { currentP: $("#txtCPCurrentPassword").val(), newP: $("#txtCPNewPassword").val(), confirmP: $("#txtCPConfirmNewPassword").val(), __RequestVerificationToken: $("[name='__RequestVerificationToken']").val() })
//            .done(function (data: any) {
//                if (data.status) {
//                    $("#boxMainChangePassword").hide();
//                    $("#boxSuccessChangePassword").show();
//                    $("#spanSuccessChangePassword").text(data.message);
//                    $("#boxErrorChangePassword").hide();
//                    $(this.Id_btnChangePassword).hide();
//                }
//                else {
//                    $("#spanErrorChangePassword").html(data.ex);
//                    $("#boxErrorChangePassword").show();
//                }
//            });
//    }
//}

//ChangePassword.Init();