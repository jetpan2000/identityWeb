const { $ } = window;

export function makeEditFormDirty() {
    var $scope = $('#boxMainController').scope();
    $scope.Edited = true;
    $scope.SaveForm.$setDirty(true);
    $scope.$apply();
}