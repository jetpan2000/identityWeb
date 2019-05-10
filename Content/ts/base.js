//declare var $: any;
//class OdissBase {
//    public static BaseUrl: string = "/";
//    public static DateFormat: string = "MM/dd/yyyy";
//    public static ShowingDisconnectedWindow: boolean = false;
//    public static Init(): void {
//    }
//    public static ShowDisconnected(): void {
//        if (!this.ShowingDisconnectedWindow) {
//            $("#modSessionDisconnected").modal();
//            $('#modSessionDisconnected').on('hidden.bs.modal', function (e: any) {
//                this.SignInAgain();
//            });
//            this.ShowingDisconnectedWindow = true;
//        }
//    }
//    public static HasFlag(flags: any, flag: any): boolean {
//        return (flags & flag) == flag;
//    }
//    private static SignInAgain(): void {
//        window.location.href = window.location.href;
//    }
//}
//OdissBase.Init();
//# sourceMappingURL=base.js.map