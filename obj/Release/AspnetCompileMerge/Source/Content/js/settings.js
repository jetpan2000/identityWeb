(function (e, t) { "use strict"; if (typeof define === "function" && define.amd) { define([], t) } else if (typeof exports === "object") { module.exports = t() } else { e.DeepDiff = t() } })(this, function (e) { "use strict"; var t, n, a = []; if (typeof global === "object" && global) { t = global } else if (typeof window !== "undefined") { t = window } else { t = {} } n = t.DeepDiff; if (n) { a.push(function () { if ("undefined" !== typeof n && t.DeepDiff === p) { t.DeepDiff = n; n = e } }) } function r(e, t) { e.super_ = t; e.prototype = Object.create(t.prototype, { constructor: { value: e, enumerable: false, writable: true, configurable: true } }) } function i(e, t) { Object.defineProperty(this, "kind", { value: e, enumerable: true }); if (t && t.length) { Object.defineProperty(this, "path", { value: t, enumerable: true }) } } function f(e, t, n) { f.super_.call(this, "E", e); Object.defineProperty(this, "lhs", { value: t, enumerable: true }); Object.defineProperty(this, "rhs", { value: n, enumerable: true }) } r(f, i); function u(e, t) { u.super_.call(this, "N", e); Object.defineProperty(this, "rhs", { value: t, enumerable: true }) } r(u, i); function l(e, t) { l.super_.call(this, "D", e); Object.defineProperty(this, "lhs", { value: t, enumerable: true }) } r(l, i); function s(e, t, n) { s.super_.call(this, "A", e); Object.defineProperty(this, "index", { value: t, enumerable: true }); Object.defineProperty(this, "item", { value: n, enumerable: true }) } r(s, i); function h(e, t, n) { var a = e.slice((n || t) + 1 || e.length); e.length = t < 0 ? e.length + t : t; e.push.apply(e, a); return e } function c(e) { var t = typeof e; if (t !== "object") { return t } if (e === Math) { return "math" } else if (e === null) { return "null" } else if (Array.isArray(e)) { return "array" } else if (e instanceof Date) { return "date" } else if (/^\/.*\//.test(e.toString())) { return "regexp" } return "object" } function o(t, n, a, r, i, p, b) { i = i || []; var d = i.slice(0); if (typeof p !== "undefined") { if (r && r(d, p, { lhs: t, rhs: n })) { return } d.push(p) } var v = typeof t; var y = typeof n; if (v === "undefined") { if (y !== "undefined") { a(new u(d, n)) } } else if (y === "undefined") { a(new l(d, t)) } else if (c(t) !== c(n)) { a(new f(d, t, n)) } else if (t instanceof Date && n instanceof Date && t - n !== 0) { a(new f(d, t, n)) } else if (v === "object" && t !== null && n !== null) { b = b || []; if (b.indexOf(t) < 0) { b.push(t); if (Array.isArray(t)) { var k, m = t.length; for (k = 0; k < t.length; k++) { if (k >= n.length) { a(new s(d, k, new l(e, t[k]))) } else { o(t[k], n[k], a, r, d, k, b) } } while (k < n.length) { a(new s(d, k, new u(e, n[k++]))) } } else { var g = Object.keys(t); var w = Object.keys(n); g.forEach(function (i, f) { var u = w.indexOf(i); if (u >= 0) { o(t[i], n[i], a, r, d, i, b); w = h(w, u) } else { o(t[i], e, a, r, d, i, b) } }); w.forEach(function (t) { o(e, n[t], a, r, d, t, b) }) } b.length = b.length - 1 } } else if (t !== n) { if (!(v === "number" && isNaN(t) && isNaN(n))) { a(new f(d, t, n)) } } } function p(t, n, a, r) { r = r || []; o(t, n, function (e) { if (e) { r.push(e) } }, a); return r.length ? r : e } function b(e, t, n) { if (n.path && n.path.length) { var a = e[t], r, i = n.path.length - 1; for (r = 0; r < i; r++) { a = a[n.path[r]] } switch (n.kind) { case "A": b(a[n.path[r]], n.index, n.item); break; case "D": delete a[n.path[r]]; break; case "E": case "N": a[n.path[r]] = n.rhs; break } } else { switch (n.kind) { case "A": b(e[t], n.index, n.item); break; case "D": e = h(e, t); break; case "E": case "N": e[t] = n.rhs; break } } return e } function d(e, t, n) { if (e && t && n && n.kind) { var a = e, r = -1, i = n.path ? n.path.length - 1 : 0; while (++r < i) { if (typeof a[n.path[r]] === "undefined") { a[n.path[r]] = typeof n.path[r] === "number" ? [] : {} } a = a[n.path[r]] } switch (n.kind) { case "A": b(n.path ? a[n.path[r]] : a, n.index, n.item); break; case "D": delete a[n.path[r]]; break; case "E": case "N": a[n.path[r]] = n.rhs; break } } } function v(e, t, n) { if (n.path && n.path.length) { var a = e[t], r, i = n.path.length - 1; for (r = 0; r < i; r++) { a = a[n.path[r]] } switch (n.kind) { case "A": v(a[n.path[r]], n.index, n.item); break; case "D": a[n.path[r]] = n.lhs; break; case "E": a[n.path[r]] = n.lhs; break; case "N": delete a[n.path[r]]; break } } else { switch (n.kind) { case "A": v(e[t], n.index, n.item); break; case "D": e[t] = n.lhs; break; case "E": e[t] = n.lhs; break; case "N": e = h(e, t); break } } return e } function y(e, t, n) { if (e && t && n && n.kind) { var a = e, r, i; i = n.path.length - 1; for (r = 0; r < i; r++) { if (typeof a[n.path[r]] === "undefined") { a[n.path[r]] = {} } a = a[n.path[r]] } switch (n.kind) { case "A": v(a[n.path[r]], n.index, n.item); break; case "D": a[n.path[r]] = n.lhs; break; case "E": a[n.path[r]] = n.lhs; break; case "N": delete a[n.path[r]]; break } } } function k(e, t, n) { if (e && t) { var a = function (a) { if (!n || n(e, t, a)) { d(e, t, a) } }; o(e, t, a) } } Object.defineProperties(p, { diff: { value: p, enumerable: true }, observableDiff: { value: o, enumerable: true }, applyDiff: { value: k, enumerable: true }, applyChange: { value: d, enumerable: true }, revertChange: { value: y, enumerable: true }, isConflict: { value: function () { return "undefined" !== typeof n }, enumerable: true }, noConflict: { value: function () { if (a) { a.forEach(function (e) { e() }); a = null } return p }, enumerable: true } }); return p });


(function ($) {
    var ajaxQueue = $({});
    $.ajaxQueue = function (ajaxOpts) { var oldComplete = ajaxOpts.complete; ajaxQueue.queue(function (next) { ajaxOpts.complete = function () { if (oldComplete) oldComplete.apply(this, arguments); next(); }; $.ajax(ajaxOpts); }); };
})(jQuery);

(function () {
    'use strict';

    angular.module('odissSettings', [])
        .controller('SettingsController', ['$scope', '$http', '$timeout', '$parse', '$filter', function ($scope, $http, $timeout, $parse, $filter) {
            var t = this;

            $scope.Languages = [{ initials: 'en', name: 'English' }, { initials: 'fr', name: 'French' }, { initials: 'es', name: 'Spanish' }, { initials: 'pt', name: 'Portuguese' }];
            $scope.Tab = 'basic';
            $scope.StaticDiff = null;
            $scope.SubTab = 'basic';
            $scope.GlobalSubTab = 'basic';
            $scope.MaxRecordsList = [10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000];
            $scope.MaxRecordsPageList = [10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            $scope.DateFormatList = ['dd MMM yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy', 'MMM dd, yyyy', 'yyyy-MM-dd'];
            $scope.ViewerTypeList = [{ name: 'Default', value: 1 }, { name: 'BrowserNative', value: 2 }, { name: 'ByBrowser', value: 3 }];
            $scope.ApplicationTypeList = [{ name: 'Regular', value: 0 }, { name: 'Custom', value: 1 }, { name: 'AP Form', value: 2 }, { name: 'Edit Form', value: 3 }, { name: 'Upload', value: 4 }, { name: 'Workflow', value: 5 }, { name: 'Data Grid', value: 6 }];
            $scope.UserAttemptsList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            $scope.MinimumPasswordLengthList = [6, 8, 10];
            $scope.MaximumPasswordLengthList = [12, 14, 16, 18, 20];
            $scope.ForcePasswordStrengthList = [true, false];
            $scope.PasswordResetList = [true, false];
            $scope.MaximumSessionTimeoutList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            $scope.UsernameReminderList = [true, false];
            $scope.LockUserMinutesList = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 45, 60];
            $scope.AutoComplete_FieldFilterTypeList = [{ name: 'None', value: 0 }, { name: 'Stored Procedure', value: 3 }];
            $scope.FieldTypeList = [{ name: 'Number', value: 1 }, { name: 'Text', value: 2 }, { name: 'Date', value: 3 }, { name: 'Tree', value: 4 }, { name: 'Dropdown', value: 5 }, { name: 'Radio', value: 6 }, { name: 'Number Range', value: 7 }, { name: 'Button', value: 8 }, { name: 'TextArea', value: 9 }, { name: 'Autocomplete', value: 10 }, { name: 'Array', value: 11 }, { name: 'QuerySelector', value: 12 }, { name: 'MultipleLink', value: 13 }];
            $scope.FieldFilterType = [{ id: 0, name: 'None' }, { id: 1, name: 'View' }, { id: 2, name: 'Json' }];
            $scope.FieldVisibilityTypeList = [{ name: 'Always', value: 0 }, { name: 'Search Filter', value: 1 }, { name: 'Search Results', value: 2 }, { name: 'Never', value: 3 }, { name: 'Viewer', value: 4 }, { name: 'Submit - NOT IMPLEMENTED YET', value: 5 }, { name: 'Only Search Results', value: 6 }];
            $scope.FieldPosition = 'FilterOrder';
            $scope.Config = null;
            $scope.OldLogo = null;
            $scope.BaseConfig = null;
            $scope.OrderingAppTabs = false;
            $scope.Checks = [{ id: 0, status: 'glyphicon-refresh' }, { id: 1, status: 'glyphicon-refresh' }, { id: 2, status: 'glyphicon-refresh' }, { id: 3, status: 'glyphicon-refresh' }];

            //$scope.DIFFCONFIG = DeepDiff($scope.Config, $scope.BaseConfig);

            $(window).bind('beforeunload', function () {
                if (t.getDiff().length > 0 && !$scope.Saved) {
                    return 'There are unsaved pending changes. Do you want leave without saving?';
                }
            });

            $scope.$watch('Saved', function (newValue, oldValue) {
                if (newValue != null) {
                    $timeout(function () {
                        $scope.Saved = false;
                    }, 3500); // Auto hide message after 3.5s
                }
            });

            $scope.$watch("app.TableName", function (selectedTable) {
                if (selectedTable) {
                    var table = $scope.db.Tables.find(function (item) {
                        return item.Name === selectedTable;
                    });

                    if (table) {
                        $scope.app.ColumnsMapTo = table.Columns;
                    }
                }
            });

            $scope.$watch("app.Fields", function (updatedFields, oldFields) {
                if (updatedFields) {
                    updatedFields.forEach(function (updatedField) {
                        updatedField.ValidationRulesJson = JSON.stringify(updatedField.ValidationRules);
                    });
                }
            }, true);

            /*
            $("#divDataTree").jstree({
                plugins: ["grid", "dnd", "contextmenu"],
                grid: {
                    columns: [
                        { header: "Name" },
                        { header: "Code", value: function (node) { return node.data.Code; } },
                        { header: "Selectable", value: function(node){ return node.data.Selectable; }}
                    ],
                    contextmenu: true,
                    resizable: true
                },
                core: {
                    "check_ballback": true,
                    data: [
                        { text: "Good", data: { Code: "E000", Selectable: true } },
                        {
                            text: "Rejected", data: { Code: "Rejected", Selectable: false }, children: [
                                { text: "PO Invalid", data: { Code: "E001", Selectable: true } },
                                  { text: "Number invalid", data: { Code: "E002", Selectable: true } }
                            ]
                        }
                    ]
                }
            });
            */

            t.loadBasic = function () {
                $http({ url: "./settings/basic", method: "POST" })
                    .success(function (data, status, headers, config) {
                        $scope.Config = data;
                        $scope.db = $scope.Config.Databases[0];
                        $scope.app = $filter('orderBy')($scope.Config.Applications, 'TabOrder')[0];
                        $scope.field = null;
                        t.getColumns();

                        if ($scope.app != null) {
                            t.updateAppJSON('Name', $scope.app.Name);
                            t.updateAppJSON('SearchTitle', $scope.app.SearchTitle);
                        }

                        $scope.BaseConfig = angular.copy($scope.Config);
                    })
                    .error(function (data, status, headers, config) {
                        alert('Error');
                    });
            };

            $scope.$watch('db.Type', function (newValue, oldValue) {
                if (newValue != null) {
                    if (newValue == 1) {
                        for (var i = 0; i < $scope.Config.Databases.length; i++) {
                            if ($scope.Config.Databases[i].ID != $scope.db.ID && $scope.Config.Databases[i].Type == 1) { // Allow only 1 main DB
                                $scope.Config.Databases[i].Type = 0;
                            }
                        }
                    }
                }
            });

            $scope.$watch('app.Name', function (newValue, oldValue) {
                if ($scope.app != null)
                    t.updateAppJSON('Name', $scope.app.Name);
            });

            $scope.$watch('app.SearchTitle', function (newValue, oldValue) {
                if ($scope.app != null)
                    t.updateAppJSON('SearchTitle', $scope.app.SearchTitle);
            });

            $scope.$watch('app.field', function (newValue, oldValue) {
                if ($scope.app != null && $scope.app.field != null) {
                    t.updateAppJSON('Field', $scope.app.field.Name);
                    t.updateAppJSON('Header', $scope.app.field.HeaderGroupName);
                    $scope.app.field.GroupHeaderByName = $scope.app.field.HeaderGroupName != null && $scope.app.field.HeaderGroupName != '';
                }
            });

            $scope.$watch('app.field.GroupHeaderByName', function (newValue, oldValue) {
                if (newValue != null)
                    if (!newValue) {
                        $scope.app.field.HeaderGroupName = null;
                        $scope.app.field.HeaderGroupNameJSON = null;
                    }
            });

            $scope.$watch('Config.Databases', function (newValue, oldValue) {
                if (newValue != null && oldValue != null && newValue.length == oldValue.length) {
                    for (var i = 0; i < newValue.length; i++)
                        if (!angular.equals(newValue[i], oldValue[i]))
                            newValue.Changed = true;
                }
            }, true);

            t.toggleReorder = function () {
                $scope.OrderingAppTabs = !$scope.OrderingAppTabs;
            };

            t.getFromJson = function (value) {
                return angular.fromJson(value);
            };

            t.resetData = function () {
                if (confirm('Are you sure you want to reset the site data to pre-defined values? This action cannot be undone.')) {
                    $http({ url: "./settings/resetdata", method: "POST" })
                        .success(function (data, status, headers, config) {
                            if (data.status) {
                                $("#spanResetStatus").text("Data successfully reset");
                            }
                            else {
                                $("#spanResetStatus").text("Error reseting the data: " + data.ex);
                            }
                        })
                        .error(function (data, status, headers, config) {
                            $("#spanResetStatus").text("Error reseting the data.");
                        });
                }
            };

            t.fromJson = function (data) {
                return angular.fromJson(data);
            };

            t.refreshSettings = function () {
                $http({ url: "./settings/refresh", method: "POST" })
                    .success(function (data, status, headers, config) {
                        if (data.status) {
                            $("#spanRefreshStatus").text("Settings successfully refreshed");

                            t.loadBasic();
                        }
                        else {
                            $("#spanRefreshStatus").text("Error refreshing the data: " + data.ex);
                        }
                    })
                    .error(function (data, status, headers, config) {
                        $("#spanRefreshStatus").text("Error refreshing settings.");
                    });;
            };

            t.moveTab = function (app, where) {
                var nextPosition = app.TabOrder + where;
                var oldPosition = app.TabOrder;

                $.each($scope.Config.Applications, function (index, value) {
                    if (value.ID == app.ID) {
                        app.TabOrder = nextPosition;
                    }
                    else if (value.TabOrder == nextPosition) {
                        value.TabOrder = oldPosition;
                    }
                });
            };

            t.newGuid = function () {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            };

            t.getDiff = function () {
                var justChanged = [];

                var deepDiff = DeepDiff.noConflict()($scope.BaseConfig, $scope.Config);

                if (deepDiff != null) {

                    for (var i = 0; i < deepDiff.length; i++) {
                        if (deepDiff[i].kind == "E" || deepDiff[i].kind == "A") {
                            justChanged.push(deepDiff[i]);
                        }
                    }
                }

                return justChanged;
            };

            t.formatDiff = function () {
                return JSON.stringify(t.getDiff(), null, 2);
            };

            t.updateAppJSON = function (type, value) {

                if ($scope.app != null && value != null) {
                    if (type == 'Name')
                        $scope.app.NameJSON = value.indexOf('{') == 0 ? JSON.parse(value) : { 'en': value };
                    else if (type == 'SearchTitle')
                        $scope.app.SearchTitleJSON = value.indexOf('{') == 0 ? JSON.parse(value) : { 'en': value };
                    else if (type == 'Field')
                        $scope.app.field.NameJSON = value.indexOf('{') == 0 ? JSON.parse(value) : { 'en': value };
                    else if (type == 'Header')
                        $scope.app.field.HeaderGroupNameJSON = value.indexOf('{') == 0 ? JSON.parse(value) : { 'en': value };
                }
            };

            t.changeShortcutIcon = function (event) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    if ($scope.OldShortcutIcon == null) {
                        $scope.OldShortcutIcon = $scope.Config.ShortcutIcon;
                    }

                    $scope.Config.ShortcutIcon = e.target.result.split(',')[1];

                    $("#inputShortcutIcon").val('');

                    $timeout(function () { $scope.$digest(); });
                };
                reader.readAsDataURL(event.target.files[0]);
            };

            t.changeLogo = function (event) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    if ($scope.OldLogo == null) {
                        $scope.OldLogo = $scope.Config.Logo;
                    }

                    //var resizedLogo = t.resizeLogo(e.target.result);

                    $scope.Config.Logo = e.target.result.split(',')[1];

                    //$scope.Config.Logo = e.target.result.split(',')[1];
                    $("#inputLogo").val('');
                    $timeout(function () {
                        $scope.$digest();
                    });
                };
                reader.readAsDataURL(event.target.files[0]);
            };

            t.resizeLogo = function (result) {
                var img = document.createElement("img");
                img.src = result;

                var canvas = document.getElementById("canvasLogo");
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                var MAX_WIDTH = 220;
                var MAX_HEIGHT = 45;
                var width = img.width;
                var height = img.height;

                //if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                //} else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
                //}
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                return canvas.toDataURL("image/png");
            };

            t.resetShortcutIcon = function () {
                $scope.Config.ShortcutIcon = $scope.OldShortcutIcon;
                $scope.ShortcutIcon = null;
            };

            t.removeShortcutIcon = function () {
                $scope.Config.ShortcutIcon = null;
            };

            t.resetLogo = function () {
                $scope.Config.Logo = $scope.OldLogo;
                $scope.OldLogo = null;
            };

            t.removeField = function () {
                //TODO: Fix this method to update FilterOrder and ResultOrder
                if (confirm('Do you really want to remove this field?')) {
                    for (var i = 0; i < $scope.app.Fields.length; i++) {
                        if ($scope.app.Fields[i].ID == $scope.app.field.ID) {
                            if ($scope.app.field.Adding)
                                $scope.app.Fields.splice(i, 1);
                            else
                                $scope.app.Fields[i] = null;

                            $scope.app.field = null;

                            break;
                        }
                    }
                }
            };

            t.allowedToMoveUp = function () {
                return $scope.app != null
                    && $scope.app.Fields != null
                    && $scope.app.Fields.length > 1
                    && $scope.app.field != null
                    && ($scope.FieldPosition == 'FilterOrder' ? ($scope.app.field.FilterOrder != 1) : ($scope.app.field.ResultOrder != 1));
            };

            t.allowedToMoveDown = function () {
                return $scope.app != null
                    && $scope.app.Fields != null
                    && $scope.app.Fields.length > 1
                    && $scope.app.field != null
                    && ($scope.FieldPosition == 'FilterOrder' ? ($scope.app.field.FilterOrder + 1 <= $scope.app.Fields.length) : ($scope.app.field.ResultOrder + 1 <= $scope.app.Fields.length));
            };

            t.fieldPositionsAreEqual = function () {
                if ($scope.app != null && $scope.app.Fields != null) {
                    for (var i = 0; i < $scope.app.Fields.length; i++) {
                        if ($scope.app.Fields[i].FilterOrder != $scope.app.Fields[i].ResultOrder) {
                            return false;
                        }
                    }
                }

                return true;
            };

            t.moveUpField = function () {
                if (this.allowedToMoveUp()) {
                    var currentPosition = null;

                    if ($scope.FieldPosition == 'FilterOrder') {
                        currentPosition = $scope.app.field.FilterOrder;
                    }
                    else {
                        currentPosition = $scope.app.field.ResultOrder;
                    }

                    var changeToPosition = currentPosition - 1;

                    for (var i = 0; i < $scope.app.Fields.length; i++) {
                        if ($scope.FieldPosition == 'FilterOrder') {
                            if ($scope.app.Fields[i].FilterOrder == changeToPosition) {
                                $scope.app.Fields[i].FilterOrder = currentPosition;
                                break;
                            }
                        }
                        else {
                            if ($scope.app.Fields[i].ResultOrder == changeToPosition) {
                                $scope.app.Fields[i].ResultOrder = currentPosition;
                                break;
                            }
                        }
                    }

                    if ($scope.FieldPosition == 'FilterOrder') {
                        $scope.app.field.FilterOrder = changeToPosition;
                    }
                    else {
                        $scope.app.field.ResultOrder = changeToPosition;
                    }
                }
            };

            t.moveDownField = function () {
                if (this.allowedToMoveDown()) {
                    var currentPosition = null;

                    if ($scope.FieldPosition == 'FilterOrder') {
                        currentPosition = $scope.app.field.FilterOrder;
                    }
                    else {
                        var currentPosition = $scope.app.field.ResultOrder;
                    }

                    var changeToPosition = currentPosition + 1;

                    for (var i = 0; i < $scope.app.Fields.length; i++) {
                        if ($scope.FieldPosition == 'FilterOrder') {

                            if ($scope.app.Fields[i].FilterOrder == changeToPosition) {
                                $scope.app.Fields[i].FilterOrder = currentPosition;
                                break;
                            }
                        }
                        else {
                            if ($scope.app.Fields[i].ResultOrder == changeToPosition) {
                                $scope.app.Fields[i].ResultOrder = currentPosition;
                                break;
                            }
                        }
                    }

                    if ($scope.FieldPosition == 'FilterOrder') {
                        $scope.app.field.FilterOrder = changeToPosition;
                    }
                    else {
                        $scope.app.field.ResultOrder = changeToPosition;
                    }

                }
            };

            t.removeDb = function () {
                if (confirm('Do you really want to remove this database connection?')) {
                    for (var i = 0; i < $scope.Config.Databases.length; i++) {
                        if ($scope.Config.Databases[i].ID == $scope.db.ID) {
                            if ($scope.db.Adding)
                                $scope.Config.Databases.splice(i, 1); // Remove from array when it's a new DB
                            else
                                $scope.Config.Databases[i] = null; // Set as null (to allow reference the DB when updating in DB)

                            $scope.db = $scope.Config.Databases[0];

                            break;
                        }
                    }
                }
            };

            t.addDb = function (obj) {
                var attrs = obj.target.attributes;

                $scope.Config.Databases.push({ ID: t.newGuid(), DBSchema: '', Type: 0, Adding: true });
                $scope.db = $scope.Config.Databases[$scope.Config.Databases.length - 1]; // Get the last added
                $timeout(function () {
                    $("#txtDBName").focus();
                });
            };

            t.getColumns = function () {
                if ($scope.app != null && $scope.app.IDDatabase != null) {
                    if ($scope.app.Type === 6) {
                        return;
                    }

                    var curDB = null;

                    for (var i = 0; i < $scope.Config.Databases.length; i++) {
                        if ($scope.Config.Databases[i].ID == $scope.app.IDDatabase) {
                            curDB = $scope.Config.Databases[i];
                            break;
                        }
                    }

                    if (curDB != null) {
                        $http({ url: "./settings/getcolumns", method: "POST", data: { dbschema: curDB.DBSchema, appID: $scope.app.ID } })
                            .success(function (data, status, headers, config) {
                                $scope.app.ColumnsMapTo = data;
                            })
                            .error(function (data, status, headers, config) {
                                alert('Error');
                            });
                    }
                }
            };

            t.addApp = function (obj) {
                var attrs = obj.target.attributes;

                // All NOT NULL fields have to be here
                $scope.Config.Applications.push({ ID: t.newGuid(), Name: 'New application name', Adding: true, Fields: [], EnablePages: true, EnableProperties: true, EnableEditProperties: true, EnableNotes: true, EnableEmail: true, EnableSubmitDocuments: false, EnableReports: false, Type: 0, CustomData: '', TabOrder: t.getLastAppTabOrder() + 1 });
                $scope.app = $scope.Config.Applications[$scope.Config.Applications.length - 1]; // Get the last added

                $timeout(function () {
                    $("#listAppName input:first").focus();
                    $("#listAppName input:first").select();
                });
            };

            t.addField = function (obj) {
                var attrs = obj.target.attributes;

                if (attrs.length == 0 || (attrs.length > 0 && attrs["data-new"] == null))
                    attrs = obj.target.parentElement.attributes;

                $scope.app.Fields.push({
                    ID: t.newGuid(),
                    IDApplication: $scope.app.ID,
                    Adding: true,
                    Name: attrs["data-new"].value,
                    Type: 2,
                    Editable: true,
                    IsRequired: false,
                    FilterOrder: t.getLastFieldFilterOrder() + 1,
                    ResultOrder: t.getLastFieldResultOrder() + 1,
                    VisibilityType: 0,
                    ValidationRules: {
                        IsRequired: false,
                        IsAlpha: false,
                        IsAlphaNumeric: false,
                        MinLength: null,
                        MaxLength: null
                    }
                }); // Type 2 = Text

                $scope.app.field = $scope.app.Fields[$scope.app.Fields.length - 1]; // Get the last added

                $timeout(function () {
                    $("#listFields input:first").focus();
                    $("#listFields input:first").select();
                });
            };


            t.getLastAppTabOrder = function () {
                if ($scope.Config != null && $scope.Config.Applications != null && $scope.Config.Applications.length > 0) {
                    return Math.max.apply(null, $scope.Config.Applications.map(function (obj) { return obj.TabOrder != null ? obj.TabOrder : 0; }));
                }
                else
                    return 0;
            };

            t.getLastFieldFilterOrder = function () {
                if ($scope.app != null && $scope.app.Fields != null && $scope.app.Fields.length > 0) {
                    return Math.max.apply(null, $scope.app.Fields.map(function (obj) { return obj.FilterOrder != null ? obj.FilterOrder : 0; }));
                }
                else
                    return 0;
            };

            t.getLastFieldResultOrder = function () {
                if ($scope.app != null && $scope.app.Fields != null && $scope.app.Fields.length > 0) {
                    return Math.max.apply(null, $scope.app.Fields.map(function (obj) { return obj.ResultOrder != null ? obj.ResultOrder : 0; }));
                }
                else
                    return 0;
            };

            t.isLanguageActive = function (lang) {
                if ($scope.Config != null) {
                    return $scope.Config.EnabledLanguages.indexOf(lang.initials) >= 0;
                }
                else
                    return false;
            };

            t.toggleLanguage = function (lang) {
                if (t.isLanguageActive(lang)) {
                    $scope.Config.EnabledLanguages.splice($scope.Config.EnabledLanguages.indexOf(lang.initials), 1);
                }
                else {
                    $scope.Config.EnabledLanguages.push(lang.initials);
                }
            };

            t.setAppJSON = function (obj, type, val, valJSON) {
                var prev = null;

                valJSON = valJSON[obj.initials];

                var prev = (val != null && val.indexOf('{') == 0) ? JSON.parse(val) : { 'en': val };

                if (valJSON == '')
                    delete prev[obj.initials];
                else
                    prev[obj.initials] = valJSON;

                var isString = (Object.keys(prev).length == 1 && prev[$scope.Languages[0].initials] != null);
                var finalValue = isString ? prev.en : JSON.stringify(prev);

                if (finalValue == "{}")
                    finalValue = null;

                if (type == 'Name')
                    $scope.app.Name = finalValue;
                else if (type == 'SearchTitle')
                    $scope.app.SearchTitle = finalValue;
                else if (type == 'Field')
                    $scope.app.field.Name = finalValue;
                else if (type == 'Header')
                    $scope.app.field.HeaderGroupName = finalValue;
            };

            t.showApp = function (app) {
                $scope.app = app;

                t.getColumns();
            };

            t.showDatabase = function (database) {
                $scope.db = database;
            };

            t.formatLanguage = function (text) {
                if (text != null)
                    if (text.indexOf('{') >= 0) {
                        return JSON.parse(text).en;
                    }
                    else
                        return text;
            };

            t.submit = function () {
                var diff = t.getDiff();

                //diff.forEach(function (diffItem) {
                //    delete diffItem.item.rhs.Table;
                //});


                $http({
                    url: "./settings/save", method: "POST",
                    data: { changes: JSON.stringify(diff), baseSettings: $scope.BaseConfig, settings: $scope.Config }
                })
                    .then(function (r) {
                        $scope.Saved = true;

                        t.loadBasic();
                    })
                    .catch(function () {
                        alert('Error');
                    })
                    .finally(function () {

                    });
            };

            t.start = function () {
                t.loadBasic();
            };

            t.validate = function () {
                var perc = 100 / 4;

                t.check(0, perc);
                t.check(1, perc);
                t.check(2, perc);
                t.check(3, perc);
            };

            t.check = function (type, progress) {
                $.ajaxQueue({
                    url: "./settings/check",
                    type: "POST",
                    data: { type: type, settings: $scope.Config },
                    success: function (result) {

                        $timeout(function () {
                            var li = $("#liCheck" + type);

                            $(".liCheck" + type).remove();

                            if (result.IsValid) {
                                $scope.Checks[type].status = "glyphicon-ok green";
                            }
                            else {
                                if (result.Errors.length > 0) {
                                    if (!li.hasClass("list-group-item-danger")) {
                                        li.addClass("list-group-item-danger");
                                    }
                                    $scope.Checks[type].status = "glyphicon-remove red";

                                    for (var i = result.Errors.length - 1; i >= 0; i--) {
                                        li.after('<li class="list-group-item list-group-item-danger small liCheck' + type + '">' + (type + 1) + '.' + (i + 1) + ". " + result.Errors[i] + '</li>');
                                    }
                                }
                                else if (result.Warnings.length > 0) {
                                    if (!li.hasClass("list-group-item-warning")) {
                                        li.addClass("list-group-item-warning");
                                    }
                                    $scope.Checks[type].status = "glyphicon-warning-sign yellow";

                                    for (var i = result.Warnings.length - 1; i >= 0; i--) {
                                        li.after('<li class="list-group-item list-group-item-alert small liCheck' + type + '">' + (type + 1) + '.' + (i + 1) + ". " + result.Warnings[i] + '</li>');
                                    }
                                }
                            }
                        });
                    },
                    error: function () {

                    }
                });
            };

            t.start();
        }])
        .directive('customOnChange', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var onChangeHandler = scope.$eval(attrs.customOnChange);
                    element.bind('change', onChangeHandler);
                }
            };
        })
        .directive('emptyToNull', function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$parsers.push(function (viewValue) {
                        if (viewValue === "") {
                            return null;
                        }
                        return viewValue;
                    });
                }
            };
        })
        .directive('jsonText', function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, element, attr, ngModel) {
                    function into(input) {
                        return JSON.parse(input);
                    }
                    function out(data) {
                        return JSON.stringify(data);
                    }
                    ngModel.$parsers.push(into);
                    ngModel.$formatters.push(out);
                }
            };
        })
        .filter('filterArray', ['$filter', function ($filter) {
            return function (list, arrayFilter, element) {
                if (arrayFilter) {
                    return $filter("filter")(list, function (listItem) {
                        return arrayFilter.indexOf(listItem[element]) != -1;
                    });
                }
            };
        }]);
})();