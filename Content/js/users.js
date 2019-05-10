function callEditUser(id) {
    angular.element("#boxMainController").scope().CallEditUser(id);
}

(function () {
    'use strict';

    var mainapp = angular.module('odissApp', ['ngTagsInput']);
    /*
        mainapp.config(function (tagsInputConfigProvider) {
            tagsInputConfigProvider.setActiveInterpolation('tagsInput', { minTags: true, maxTags: true });
        });
    */

    mainapp.controller('UsersController', ['$scope', '$http', '$timeout', '$window', '$filter', '$compile', function ($scope, $http, $timeout, $window, $filter, $compile) {
        var u = this;

        $scope.TB = null;
        $scope.Edited = false;
        $scope.User = null;
        $scope.Editing = false;
        $scope.UserPermissions = null;
        $scope.UserTypes = null;
        $scope.MaxPerPage = 10;
        $scope.DefaultUserType = 0; // Regular
        $scope.ModalModify = $("#modModify");
        $scope.TabPermission = 'actions';
        $scope.UpdateSearchResult = false;

        $scope.SetAPView = function (viewName) {
            window.postal.publish({
                channel: 'app',
                topic: 'users.setAPView',
                data: viewName
            });
        }

        $scope.CallEditUser = function (id) {
            u.editUser(id);
        };

        $scope.ValidatePassword = function (password) {
            var bLength = password.length >= $scope.MinimumPasswordLength && password.length <= $scope.MaximumPasswordLength;
            var bUpperLetters = /[A-Z]/.test(password);
            var bLowerLetters = /[a-z]/.test(password);
            var bSpecialChars = true;//     /[!@#$&*]/.test(password);
            var bNumbers = /[0-9]/.test(password);

            if ($("#hidForcePasswordStrength").val() == "False") {
                bUpperLetters = bLowerLetters = bSpecialChars = bNumbers = true;
            }

            if (bLength && bUpperLetters && bLowerLetters && bSpecialChars && bNumbers)
                return true;
            else
                return false;
        };

        $scope.$watch('User.Type', function (newValue, oldValue) {
            if (newValue != oldValue) {
                // Disable for Super or Octacom users
                var enable = !(newValue == 3 || newValue == 4);

                u.disableRestrictedPermissions();
                u.enableNodesApplications(enable);
                u.enableNodesPermissions(enable);

                if (!$scope.Editing) {
                    u.setDefaultPermissions(newValue);
                    u.setDefaultDocuments(newValue);
                }
            }
        });

        $scope.$watch('User.Permissions', function (newValue, oldValue) {
            if (newValue != oldValue) {
                if (u.hasAnyApp()) {
                    $scope.TreeApplications.jstree('select_all');
                }
            }
        });

        $scope.$watch('Message', function (newValue, oldValue) { //TODO: Hide error if visible
            if (newValue != null) {
                $timeout(function () {
                    $scope.Message = null;
                }, 3500); // Auto hide message after 3.5s
            }
        });

        $scope.$watch('MessageError', function (newValue, oldValue) { //TODO: Hide success if visible
            if (newValue != null) {
                $timeout(function () {
                    $scope.MessageError = null;
                }, 3500); // Auto hide message after 3.5s
            }
        });

        $scope.$watch('MessageWarning', function (newValue, oldValue) { //TODO: Hide success/error if visible
            if (newValue != null) {
                $timeout(function () {
                    $scope.MessageWarning = null;
                }, 10000); // Auto hide message after 10s
            }
        });

        angular.element(document).ready(function () {
            $scope.TB = $('#tbUsers').DataTable({
                deferLoading: 0,
                "aaSorting": [], // Disable automatic order
                "pageLength": $scope.MaxPerPage,
                processing: true,
                serverSide: true,
                ajax: {
                    url: './users', type: "POST", data: function (d) {
                        if ($scope.TB != null) {
                            var order = $scope.TB.order();
                            if (order != null && order.length > 0) {
                                $("#sort").val(order[0][0] + "," + order[0][1]);
                            }
                        }

                        return $("#frmUsers").serialize();
                    }
                },

                language: DTLocale($window.lang),
                conditionalPaging: true,
                dom: 'itBpr',
                "initComplete": function (settings, json) {
                    $('#tbUsers').show();
                    $("#page").val(1); // Set to load the pages. Page = 1
                },
                columnDefs: [
                    {
                        targets: 0, render: function (data, type, row, meta) {
                            var id = row[4];
                            var username = row[0];

                            return '<a href onclick="callEditUser(\'' + id + '\')" data-target="#modModify" data-toggle="modal">' + username + '</a>';
                        }
                    }
                ]
            });

            $("#frmUsers").on('submit', function (e) {
                e.preventDefault();
                $("#page").val(1);
                //$scope.TBOdissAudit.clearTable();
                $scope.TB.ajax.reload();
                //$scope.TB.fixedHeader.enable();

                return false;
            });

            $("#tbUsers").on('page.dt', function () {
                $("#page").val($scope.TB.page.info().page + 1);
            });

            $("#tbAudit").on("xhr.dt", function () {
                var xhrResult = $scope.TB.ajax.json();

                if (xhrResult.IsAuthenticated != null && !xhrResult.IsAuthenticated) {
                    OdissBase.showDisconnected();
                }
            });

            $("#tbAudit").on('init.dt', function () {
                $(".dataTables_empty").html("");
            });

            $scope.ModalModify.on('shown.bs.modal', function () {
                $timeout(function () {
                    $('#tabsUser li a:first').tab('show'); // Select the first tab
                });

                if (!$scope.Editing) {
                    $timeout(function () {
                        $("#UserName").focus();
                    });
                }
            });

            $scope.ModalModify.on('hide.bs.modal', function () {
                //TODO: Set action/permissions tab as visible
                if ($scope.UpdateSearchResult) {
                    $("#frmUsers").submit();
                }
            });

            $('.form-group-date').not('.disabled').daterangepicker({
                singleDatePicker: true,
                showDropdowns: true,
                ranges: DRPRanges(lang),
                locale: DRPLocale(lang),
                minDate: moment()
            });

            $('.form-group-date').on('apply.daterangepicker', function (ev, picker) {
                var val = picker.startDate.format(OdissBase.dateFormat);
                $(this).find('input').val(val);
                $(this).find('input').change();
            });

            $('.form-group-date').on('cancel.daterangepicker', function (ev, picker) {
                $(this).find('input').val('');
                $(this).find('input').change();
            });

            if ($scope.EXTRAINFO != null) {
                $scope.UserTypes = $scope.EXTRAINFO.UserTypes;
                $scope.UserPermissions = $scope.EXTRAINFO.UserPermissions;
                $scope.UserDefaultDocuments = $scope.EXTRAINFO.UserDefaultDocuments;
            }

            $scope.TreePermissions = $('#ulPermissions').jstree({ "plugins": ["checkbox", "html_data", "wholerow"], "core": { "themes": { "variant": "small" } } })
                .on('ready.jstree', function () { $scope.TreePermissions.jstree('open_all'); })
                .on('changed.jstree', function (event, action) {
                    if (action.event != null) {
                        if (action.action == "select_node") {
                            if (action.node.children_d.length > 0) {
                                $.each(action.node.children_d, function (index, value) {
                                    if (value.indexOf('chk') != -1) {
                                        $scope.User.Permissions |= $scope.UserPermissions[value.replace('chk', '')];
                                    }
                                });
                            }
                            else {
                                $scope.User.Permissions |= $scope.UserPermissions[action.node.id.replace('chk', '')];
                            }

                            $scope.Edited = true;

                        } else if (action.action == "deselect_node") {
                            if (action.node.children_d.length > 0) {
                                $.each(action.node.children_d, function (index, value) {
                                    if (value.indexOf('chk') != -1) {
                                        $scope.User.Permissions &= ~$scope.UserPermissions[value.replace('chk', '')];
                                    }
                                });
                            }
                            else {
                                $scope.User.Permissions &= ~$scope.UserPermissions[action.node.id.replace('chk', '')];
                            }

                            $scope.Edited = true;
                        }

                        $timeout(function () { // Avoid errors with digest in progress
                            $scope.$digest();
                        });
                    }
                });

            $scope.TreeApplications = $("#ulApplications").jstree({ "plugins": ["checkbox", "html_data", "wholerow"], "core": { "themes": { "variant": "small" } } })
                .on('ready.jstree', function () { $scope.TreeApplications.jstree('open_all'); })
                .on('changed.jstree', function (event, action) {
                    if (action.event != null || event != null) {
                        if (action.action == "select_node" || action.action == "deselect_node") {
                            if (action.action == "deselect_node") {
                                var action_id = action.instance.get_node(action.node).data.id;

                                if ($scope.User.DocumentsArray) {
                                    $.each($scope.User.DocumentsArray,
                                        function (index, value) {
                                            if (index.indexOf("|" + action_id) != -1) {
                                                $.each($scope.User.DocumentsArray[index],
                                                    function (index2, value2) {
                                                        var ixToDelete = $scope.User.Documents.indexOf(value2);

                                                        $scope.User.Documents.splice(ixToDelete, 1);
                                                        $scope.User.DocumentsChanged = true;
                                                    });

                                                $scope.User.DocumentsArray[index] = [];
                                            }
                                        });
                                }
                            }

                            $scope.User.Applications = [];

                            $.each($scope.TreeApplications.jstree('get_selected'), function (index, value) {
                                $scope.User.Applications.push(action.instance.get_node($scope.TreeApplications.jstree('get_selected')[index]).data.id);
                            });

                            $scope.Edited = true;
                        }

                        $timeout(function () { // Avoid digest in progress errors
                            if (!u.hasAnyApp())
                                $scope.$digest();
                        });
                    }
                });

            $scope.TreeGroups = $("#ulGroups").jstree({ "plugins": ["checkbox", "html_data", "wholerow"], "core": { "themes": { "variant": "small" } } })
                .on('ready.jstree', function () { $scope.TreeGroups.jstree('open_all'); })
                .on('changed.jstree', function (event, action) {
                    if (action.event != null || event != null) {
                        if (action.action == "select_node" || action.action == "deselect_node") {
                            $scope.User.Groups = [];

                            $.each($scope.TreeGroups.jstree('get_selected'), function (index, value) {
                                $scope.User.Groups.push(action.instance.get_node($scope.TreeGroups.jstree('get_selected')[index]).data.id);
                            });

                            $scope.Edited = true;
                        }

                        $timeout(function () { // Avoid digest in progress errors
                            $scope.$digest();
                        });
                    }
                });

            setTimeout(function () {
                var tree = $('.form-control-tree-documents');

                tree.jstree({
                    "plugins": ["checkbox", "html_data", "search"],
                    "core": { "themes": { "variant": "small" } },
                    "search": {
                        "show_only_matches": true, "search": function () { }
                    },
                    "checkbox": {
                        "three_state": false,
                        "cascade": "down"
                    }
                }).on('changed.jstree', function (event, action) {
                    if (action.event != null) {
                        //NEW
                        var appid = $(this).data('app-id');
                        var fieldid = $(this).data('field-id');

                        if ($scope.User != null && $scope.User.Documents != null) {
                            if (action.action == "select_node") {
                                $scope.User.DocumentsChanged = true;

                                if (action.node.children_d.length > 0) {

                                    // Add parent node
                                    var valParent = action.node.id.replace("tree-" + appid + "-" + fieldid + "_", "");
                                    var varToAddParent = { IDApplication: appid, IDField: fieldid, FieldValue: valParent };
                                    if (!u.hasDocument(varToAddParent))
                                        $scope.User.Documents.push(varToAddParent);

                                    $.each(action.node.children_d, function (index, value) {
                                        var val = value.replace("tree-" + appid + "-" + fieldid + "_", "");
                                        var varToAdd = { IDApplication: appid, IDField: fieldid, FieldValue: val };

                                        if (!u.hasDocument(varToAdd))
                                            $scope.User.Documents.push(varToAdd);
                                    });
                                }
                                else {
                                    var val = action.node.id.replace("tree-" + appid + "-" + fieldid + "_", "");
                                    var varToAdd = { IDApplication: appid, IDField: fieldid, FieldValue: val };
                                    if (!u.hasDocument(varToAdd))
                                        $scope.User.Documents.push(varToAdd);
                                }

                                $scope.Edited = true;
                            }
                            else if (action.action == "deselect_node") {
                                $scope.User.DocumentsChanged = true;

                                if (action.node.children_d.length > 0) {

                                    // Remove parent node
                                    var valParent = action.node.id.replace("tree-" + appid + "-" + fieldid + "_", "");

                                    $.each($scope.User.Documents, function (index, value) {
                                        if (value.IDApplication == appid && value.IDField == fieldid && value.FieldValue == valParent) {
                                            $scope.User.Documents.splice(index, 1);
                                            return false;
                                        }
                                    });

                                    $.each(action.node.children_d, function (index, value) {
                                        var val = value.replace("tree-" + appid + "-" + fieldid + "_", "");

                                        $.each($scope.User.Documents, function (index2, value2) {
                                            if (value2.IDApplication == appid && value2.IDField == fieldid && value2.FieldValue == val) {
                                                $scope.User.Documents.splice(index2, 1);
                                                return false;
                                            }
                                        });
                                    });
                                }
                                else {
                                    var val = action.node.id.replace("tree-" + appid + "-" + fieldid + "_", "");

                                    $.each($scope.User.Documents, function (index, value) {
                                        if (value.IDApplication == appid && value.IDField == fieldid && value.FieldValue == val) {
                                            $scope.User.Documents.splice(index, 1);
                                            return false;
                                        }
                                    });
                                }


                                /*
                                                                  $.each($scope.User.DocumentsArray,
                                                                      function (index, value) {
                                                                          if (index.indexOf("|" + action_id) != -1) {
                                                                              $.each($scope.User.DocumentsArray[index],
                                                                                  function (index2, value2) {
                                                                                      var ixToDelete = $scope.User.Documents.indexOf(value2);
                                
                                                                                      $scope.User.Documents.splice(ixToDelete, 1);
                                                                                  });
                                
                                                                              $scope.User.DocumentsArray[index] = [];
                                                                          }
                                                                      });*/

                                $scope.Edited = true;
                            }
                        }


                        //OLD
                        /*
                        if (action.action == "select_node" || action.action == "deselect_node") {
                            $scope.User.Documents = [];
                            $scope.User.DocumentsChanged = true;

                            $.each($('.form-control-tree-documents'), function (indexTree, valueTree) {
                                var appId = $(valueTree).data('app-id');
                                var fieldId = $(valueTree).data('field-id');

                                $.each($(valueTree).jstree('get_selected'), function (index, value) {
                                    var fieldValue = value.replace('tree-' + appId + '-' + fieldId + '_', '');

                                    $scope.User.Documents.push({ IDApplication: appId, IDField: fieldId, FieldValue: fieldValue });
                                    //$scope.User.Documents.push(action.instance.get_node($scope.TreeApplications.jstree('get_selected')[index]).data.id);
                                });
                            });

                            $scope.Edited = true;
                        }
                        */

                        $timeout(function () { // Avoid digest in progress errors
                            if (!u.hasAnyApp())
                                $scope.$digest();
                        });
                    }

                    /*
                    // 1. Get selected values and put it to the hidden input to allow submitting with the form
                    var idBase = $(this).data('id');
                    var idField = $(this).data('field-id');
                    var idApp = $(this).data('app-id');
                    var inputValues = $(this).siblings('input#restrict-app-doc-' + idField + '-' + idApp); // Attention. If the html structure changes, change it from siblings to anything that fits.
                    var selectedValues = $(this).jstree("get_selected").toString().replace(new RegExp(idBase + '_sub_', "g"), '').replace(new RegExp(idBase + '_', "g"), ''); // Remove fieldName from Ids before saving to hidden field
                    var arrSelectedValues = selectedValues.split(',');

                    var isNumber = true;

                    if (arrSelectedValues.length) {
                        $.each(arrSelectedValues, function (index, value) {
                            if (!$.isNumeric(value)) {
                                isNumber = false;
                                return;
                            }
                        });

                        if (isNumber) {
                            inputValues.val(selectedValues);
                        }
                        else {
                            inputValues.val(arrSelectedValues.map(function (value) {
                                return "'" + value.replace("'", "\'") + "'";
                            }).join(','));
                        }
                    }
                    */

                    // /1
                });

                $(".form-search-tree").keyup(function () {
                    $(this).next('.form-control-tree-documents').jstree(true).search($(this).val());
                });
            }, 10);
        }); // Angular ready <end>

        u.setPasswordLengthLimits = function (minimum, maximum) {
            $scope.MinimumPasswordLength = minimum;
            $scope.MaximumPasswordLength = maximum;
        };

        u.hasAnyPermission = function () {
            if ($scope.User != null && ($scope.User.Type == 3 || $scope.User.Type == 4))
                return true;

            return false;
        };

        u.hasAnyDocuments = function () {
            if ($scope.User != null && ($scope.User.Type == 3 || $scope.User.Type == 4))
                return true;

            return false;
        };

        u.hasDocument = function (obj) {
            if ($scope.User == null) return false;

            var indexFound = false;

            $.each($scope.User.Documents, function (index, value) {
                if (value.IDApplication == obj.IDApplication && value.IDField == obj.IDField && value.FieldValue == obj.FieldValue) {
                    indexFound = true;
                    return false;
                }
            });

            return indexFound;
        };

        u.hasDocumentIndex = function (obj) {
            if ($scope.User == null) return null;

            var indexFound = null;

            $.each($scope.User.Documents, function (index, value) {
                if (value.IDApplication == obj.IDApplication && value.IDField == obj.IDField && value.FieldValue == obj.FieldValue) {
                    indexFound = index;
                    return false; // break;
                }
            });

            return indexFound;
        };

        u.setDefaultPermissions = function (userType) {
            if (userType == 1 && $scope.EXTRAINFO != null && $scope.EXTRAINFO.UserDefaultPermissions != null) {
                u.setUserPermissions($scope.EXTRAINFO.UserDefaultPermissions);
            }
        };

        u.setDefaultDocuments = function (userType) {
            if (userType == 1 && $scope.EXTRAINFO != null && $scope.EXTRAINFO.UserDefaultDocuments != null) {
                var defaultDocuments = $scope.EXTRAINFO.UserDefaultDocuments;
                var docsToAdd = [];

                for (var i = 0; i < defaultDocuments.length; i++) {
                    var curItem = defaultDocuments[i];
                    var idapp = curItem.IDApplication;
                    var idfield = curItem.IDField;

                    u.setUserApplications([idapp]);

                    for (var j = 0; j < curItem.FieldValues.length; j++) {
                        if (curItem.FieldValues[j] == "INTERNAL_USERNAME") {
                            if ($scope.User.UserName != null && $scope.User.UserName != '')
                                docsToAdd.push({ IDApplication: idapp, IDField: idfield, FieldValue: $scope.User.UserName });
                        }
                        else {
                            docsToAdd.push({ IDApplication: idapp, IDField: idfield, FieldValue: curItem.FieldValues[j] });
                        }
                    }
                }

                if (docsToAdd.length > 0) {

                    $scope.User.Documents = docsToAdd;

                    u.setUserDocuments(docsToAdd);

                    $scope.User.DocumentsChanged = true;
                    $scope.Edited = true;
                }
            }
        };

        u.getTotalDocuments = function (appid) {
            var total = 0;

            if ($scope.User != null) {
                if ($scope.User.Documents != null) {
                    angular.forEach($scope.User.Documents, function (value, key) {
                        if (value.IDApplication == appid) {
                            total++;
                        }
                    });
                }
            }

            return total;
        };

        u.canEditUserType = function () {
            if ($scope.Editing) {
                // Can't update Octacom
                if ($scope.UserBase.Type == 4) {
                    return false;
                }

                if ($scope.LoggedUserType == 4) {
                    return true;
                }

                if ($scope.UserBase.Type >= 3 && $scope.LoggedUserType == 3) {
                    return false;
                }

                if ($scope.UserBase.Type >= 2 && $scope.LoggedUserType == 2) {
                    return false;
                }

                return true;
            }
            else {
                return true;
            }
        };

        u.canDelete = function () {
            if (!$scope.Editing || !$scope.UserBase.Active || $scope.LoggedUserID == $scope.UserBase.ID) {
                return false;
            }

            if ($scope.LoggedUserType != 4) // Not octacom
            {
                if ($scope.LoggedUserType == 3) // Super
                {
                    if ($scope.UserBase.Type >= 3) {
                        return false;
                    }
                }
                else if ($scope.LoggedUserType == 2) // Admin
                {
                    if ($scope.UserBase.Type >= 2) {
                        return false;
                    }
                }
            }

            return true;
        };

        u.userTypeCombo = function () {
            if ($scope.LoggedUserType == 2) // Admin
            {
                return $filter('filter')($scope.UserTypes, function (obj, index, arr) { return obj.value <= 2; });
            }
            else if ($scope.LoggedUserType == 3) // Super
            {
                return $filter('filter')($scope.UserTypes, function (obj, index, arr) { return obj.value < 3; });
            }

            return $scope.UserTypes;
        };

        u.autocompleteDocument = function (appid, idfield, query) {
            return $http({ url: "./app/" + appid + "/autocompletepermission", method: "POST", data: { name: idfield, value: query } })
                .then(function (result) {
                    var data = result.data;

                    if (data.status)
                        return data.result;
                })
                .catch(function () {

                });
        };

        u.hasAnyApp = function () {
            if ($scope.User != null && ($scope.User.Type == 3 || $scope.User.Type == 4))
                return true;

            if ($scope.User != null && $scope.User.Permissions != null && $scope.UserPermissions != null)
                return hasFlag($scope.User.Permissions, $scope.UserPermissions.AnyApplication);

            return false;
        };

        u.documentsAdding = function ($tag) {
            if (!$tag) return false;
            if (!$tag.IDApplication || !$tag.IDField) return false;

            return true;
        };

        u.documentsAdd = function ($tag) {
            $scope.User.DocumentsChanged = true;

            if (typeof $scope.User.Documents === 'undefined') {
                $scope.User.Documents = [];
            }

            $scope.User.Documents.push($tag);
        };

        u.documentsRemove = function ($tag) {
            $scope.User.DocumentsChanged = true;

            if (typeof $scope.User.Documents === 'undefined') {
                $scope.User.Documents = [];
            }

            var indexToRemove = u.hasDocumentIndex($tag);

            if (indexToRemove != null)
                $scope.User.Documents.splice(indexToRemove, 1);
        };

        u.hasAppSelected = function (app) {
            if ($scope.User != null && $scope.User.Applications != null)
                for (var i = 0; i < $scope.User.Applications.length; i++)
                    if (app == $scope.User.Applications[i])
                        return true;

            if (this.hasAnyApp())
                return true;

            return false;
        };

        u.setFirstAppUser = function () {
            if ($scope.User != null && $scope.User.Applications != null)
                for (var i = 0; i < $scope.User.Applications.length; i++) {
                    if (u.hasAppSelected($scope.User.Applications[i])) {
                        if ($("#restrict-app-doc-" + $scope.User.Applications[i]).length > 0) {
                            $scope.TabDocument = $scope.User.Applications[i];
                            break;
                        }
                    }
                }
        };

        u.setAutoComplete = function () {
            var idUser = null;

            if ($scope.User != null && $scope.User.ID != null)
                idUser = $scope.User.ID;

            $('#txtUsernameCopyPermissions').autocomplete('dispose');

            $('#txtUsernameCopyPermissions').autocomplete({
                showNoSuggestionNotice: true,
                serviceUrl: './users/searchuserpermissions', noCache: true, params: { idUser: idUser },
                onSelect: function (suggestion) {
                    var userId = suggestion.data.IDUser;
                    $http({ url: "./users/getuserpermissions", method: "POST", data: { userId: userId } })
                        .then(function (result) {
                            result = result.data;
                            u.setUserPermissions(result.Actions);
                            u.setUserApplications(result.Applications);
                            u.setUserDocuments(result.Documents);
                            //TODO: Set groups

                            $scope.User.Documents = result.Documents;

                            $scope.Edited = true;
                            $timeout(function () {
                                $scope.Message = Words.User_PermissionsCopied + suggestion.value;
                            });
                        })
                        .catch(function () {
                            $scope.Message = Words.User_ErrorCopyingPermissions;
                        });
                },
                onSearchComplete: function () {
                    u.enableNodesPermissions(false);
                },
                onHide: function () {
                    u.enableNodesPermissions(true);
                },
                onSearchError: function (query, jqXHR, textStatus, errorThrown) {
                    u.enableNodesPermissions(true);
                }
            });
        };


        u.totalPerms = function () {
            if ($scope.User != null)
                return $.grep($scope.TreePermissions.jstree("get_selected"), function (value) { return value.indexOf('chk') >= 0; }).length;

            return 0;
        };

        u.totalApps = function () {
            if ($scope.User != null)
                return $.grep($scope.TreeApplications.jstree("get_selected"), function (value) { return value.indexOf('chk') >= 0; }).length;

            return 0;
        };

        u.totalDocuments = function () {
            var total = 0;

            if ($scope.User != null)
                if ($scope.User.Documents != null)
                    total += $scope.User.Documents.length;

            return total;
        };

        u.totalGroups = function () {
            if ($scope.User != null)
                return $.grep($scope.TreeGroups.jstree("get_selected"), function (value) { return value.indexOf('chk') >= 0; }).length;

            return 0;
        };

        u.enableNodesApplications = function (enable) {
            var bgcolor = enable ? '#FFFFFF' : '#F0F0F0';
            var treeCall = enable ? 'enable_node' : 'disable_node';

            $scope.TreeApplications.css('background-color', bgcolor);
            var nodes = $scope.TreeApplications.jstree(true).get_json('#', { 'flat': true });
            $.each(nodes, function (key, value) {
                $scope.TreeApplications.jstree(treeCall, value.id);
            });
        };

        u.enableNodesPermissions = function (enable) {
            var bgcolor = enable ? '#FFFFFF' : '#F0F0F0';
            var treeCall = enable ? 'enable_node' : 'disable_node';

            $scope.TreePermissions.css('background-color', bgcolor);
            var nodes = $scope.TreePermissions.jstree(true).get_json('#', { 'flat': true });
            $.each(nodes, function (key, value) {
                $scope.TreePermissions.jstree(treeCall, value.id);
            });
        };

        u.setUserPermissions = function (permissions) {
            $scope.User.Permissions = permissions;

            $("#ulPermissions").jstree('deselect_all');

            if (permissions != null) {
                for (var key in $scope.UserPermissions)
                    if (['None', 'All', 'AnyApplication'].indexOf(key) == -1)
                        if (hasFlag(permissions, $scope.UserPermissions[key]))
                            $scope.TreePermissions.jstree(true).select_node(['chk' + key]);
            }
        };

        u.setUserDocuments = function (documents) {
            // Set docs for trees
            if ($(".form-control-tree-documents").length) {
                $(".form-control-tree-documents").jstree('deselect_all');

                if (documents != null) {
                    $.each($('.form-control-tree-documents'), function (indexTrees, valueTrees) {
                        var tree = $(this);
                        var nodes = tree.jstree(true).get_json('#', { 'flat': true });
                        var appId = tree.data('app-id');
                        var fieldId = tree.data('field-id');

                        //tree.jstree(true).select_node(documents.map(function (a) { return a.TreeID; }), true);

                        $.each(documents, function (indexDocument, valueDocument) {
                            if (valueDocument.IDApplication == appId && valueDocument.IDField == fieldId) {
                                $.each(nodes, function (indexNodes, valueNodes) {
                                    if (valueNodes.id == 'tree-' + appId + '-' + fieldId + '_' + valueDocument.FieldValue)
                                        tree.jstree(true).select_node([valueNodes.id]);
                                    // Do not set automatticaly User.Documents
                                });
                            }
                        });
                    });
                }
            }

            // Set docs for other field types
            if (documents != null && $scope.User != null) {
                if ($scope.User.DocumentsArray != null) {
                    angular.forEach($scope.User.DocumentsArray, function (value, key) {
                        $scope.User.DocumentsArray[key] = [];
                    });
                }
                else {
                    $scope.User.DocumentsArray = {};
                }

                for (var i = 0; i < documents.length; i++) {
                    var curDoc = documents[i];

                    if (!(curDoc.IDField + "|" + curDoc.IDApplication in $scope.User.DocumentsArray)) {
                        $scope.User.DocumentsArray[curDoc.IDField + "|" + curDoc.IDApplication] = [];
                    }

                    $scope.User.DocumentsArray[curDoc.IDField + "|" + curDoc.IDApplication].push(angular.copy(curDoc));
                }
            }
        };

        u.setUserApplications = function (applications) {
            $scope.User.Applications = [];
            $scope.TreeApplications.jstree('deselect_all');

            if (applications != null) {

                var nodes = $scope.TreeApplications.jstree(true).get_json('#', { 'flat': true });

                $.each(applications, function (keyapp, valueapp) {
                    $.each(nodes, function (key, value) {
                        var appid = value.data.id;
                        if (appid == valueapp) {
                            $scope.TreeApplications.jstree(true).select_node([value.id]);
                        }
                    });
                });
            }
        };

        u.setUserGroups = function (groups) {
            if ($scope.TreeGroups != null) {
                $scope.User.Groups = [];
                $scope.TreeGroups.jstree('deselect_all');

                if (groups != null) {
                    var nodes = $scope.TreeGroups.jstree(true).get_json('#', { 'flat': true });

                    $.each(groups,
                        function (keygroup, valuegroup) {
                            $.each(nodes,
                                function (key, value) {
                                    var groupid = value.data.id;
                                    if (groupid == valuegroup) {
                                        $scope.TreeGroups.jstree(true).select_node([value.id]);
                                    }
                                });
                        });
                }
            }
        };

        u.disableRestrictedPermissions = function () {
            var userType = null;

            if ($scope.Editing) {
                userType = $scope.UserBase.Type;
            }
            else {
                userType = $scope.User.Type;
            }

            if (userType < 2 || $scope.LoggedUserType <= 2) {
                $timeout(function () {
                    $scope.TreePermissions.jstree('uncheck_node', 'chkViewAudits');
                    $scope.TreePermissions.jstree('disable_node', 'chkViewAudits');
                });
            }
        };

        u.addUser = function () {
            $("#txtUsernameCopyPermissions").val('');

            $scope.SaveForm.$setPristine();

            $scope.Editing = false;
            $scope.Edited = false;

            $scope.User = {};
            $scope.User.Type = $scope.DefaultUserType;

            u.setAutoComplete();

            $scope.TreeApplications.jstree('deselect_all');
            $scope.TreePermissions.jstree('deselect_all');

            if ($scope.TreeGroups != null)
                $scope.TreeGroups.jstree('deselect_all');

            $(".form-control-tree-documents").jstree('deselect_all');

            u.disableRestrictedPermissions();

            $scope.ModalModify.modal('show');

            window.postal.publish({
                channel: 'app',
                topic: 'users.add'
            });
        };

        u.removeUser = function () {
            if (confirm(Words.User_ConfirmUserDelete)) {
                $http({ url: "./users/remove", method: "POST", data: { id: $scope.User.ID } })
                    .then(function (result) {
                        result = result.data;

                        if (result.status) {
                            $scope.User = null;
                            $scope.Editing = null;

                            $scope.UpdateSearchResult = true;

                            alert(Words.User_Removed);
                        }
                        else {
                            alert(Words.User_ErrorRemoving);
                        }
                    })
                    .catch(function () {
                        alert(Words.User_ErrorRemoving);
                    });
            }
        };

        u.saveUser = function (event) {

            if (!$scope.SaveForm.$valid)
                return false;

            $(event.target).parent().find('button').attr('disabled', 'disabled'); //

            $http({ url: "./users/save", method: "POST", data: $scope.User })
                .then(function (result) {
                    result = result.data;

                    if (result.status) {
                        $scope.UpdateSearchResult = true;

                        if (!$scope.Editing) { // Added
                            $scope.Message = angular.element(event.target).data('add');
                            u.editUser(result.id, event);
                        }
                        else {
                            $scope.Message = angular.element(event.target).data('edit');
                        }
                    }
                    else {
                        if (result.restrict) {
                            $scope.MessageWarning = result.ex;
                        }
                        else if (result.maximum) {
                            $scope.MessageError = result.ex;
                        }
                        else {
                            $scope.MessageError = angular.element(event.target).data('error');
                        }
                    }

                    $(event.target).parent().find('button').removeAttr('disabled', 'disabled');

                    window.postal.publish({
                        channel: 'app',
                        topic: 'users.edit.saveCompleted',
                        data: {
                            e: event,
                            user: $scope.User,
                            saveResult: result
                        }
                    });
                })
                .catch(function (err) { $scope.MessageError = angular.element(event.target).data('error'); })
                .finally(function () {
                    $(event.target).parent().find('button').removeAttr('disabled', 'disabled');
                });

            window.postal.publish({
                channel: 'app',
                topic: 'users.edit.saveClicked',
                data: {
                    e: event,
                    user: $scope.User
                }
            });
        };

        u.editUser = function (id, $event) {

            if ($scope.User != null)
                $scope.User.Email = '';

            $scope.SaveForm.$setPristine();
            $scope.SaveForm.$setUntouched();

            $("#txtUsernameCopyPermissions").val('');

            $scope.MessageError = '';

            $http({ url: "./users/get", method: "POST", data: { id: id }, 'headers': { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(function (result) {
                    result = result.data;

                    if (result.IsAuthenticated != null && !result.IsAuthenticated) {
                        OdissBase.showDisconnected();
                        return;
                    }

                    if (result.User == null) {
                        return;
                    }

                    $scope.AllowEdit = true;
                    $scope.Editing = true;
                    $scope.User = result.User;
                    $scope.UserBase = angular.copy(result.User);
                    $scope.Edited = false;

                    try {
                        $scope.User.Expire = moment($scope.User.Expire).format(OdissBase.dateFormat);
                    } catch (e) { }

                    if ($scope.LoggedUserType != 4) {
                        if ($scope.UserBase.Type == 4 || ($scope.User.Type == 3 && $scope.User.ID != $scope.LoggedUserID)) {
                            $scope.AllowEdit = false;
                            $scope.MessageError = Words.User_NoPermissionEdit;
                        }
                    }

                    if (!$scope.User.Active)
                        $scope.AllowEdit = false;

                    u.setAutoComplete();

                    // Permissions
                    u.setUserPermissions(result.User.Permissions);
                    u.setUserDocuments(result.User.Documents);
                    u.setUserApplications(result.User.Applications);
                    u.setUserGroups(result.User.Groups);

                    u.disableRestrictedPermissions();

                    $scope.TabPermission = 'actions';

                    window.postal.publish({
                        channel: 'app',
                        topic: 'users.edit.getUser',
                        data: result
                    });

                    //u.setFirstAppUser();
                })
                .catch(function (result) {
                    alert(Words.User_ErrorLoading);
                });
        };
    }])
        .directive('password', ['$timeout', function ($timeout) {
            return {
                require: 'ngModel',
                controller: ['$element', '$scope', function ($element, $scope) {
                    var ctrl = $element.controller('ngModel');

                    ctrl.$validators.password =
                        function (modelValue, viewValue) {
                            if (viewValue == null)
                                return true;

                            if ($scope.Editing && $scope.AllowEdit) {
                                if ($scope.User.PasswordChanged) {
                                    return $scope.ValidatePassword(viewValue);
                                }
                                else {
                                    return true;
                                }
                            }
                            else if (!$scope.Editing) {
                                return $scope.ValidatePassword(viewValue);
                            }
                            else {
                                return false;
                            }
                        };
                }]
            };
        }])
        .directive('compareTo', function () {
            return {
                require: "ngModel",
                scope: {
                    otherModelValue: "=compareTo"
                },
                link: function (scope, element, attributes, ngModel) {

                    ngModel.$validators.compareTo = function (modelValue) {
                        return modelValue == scope.otherModelValue;
                    };

                    scope.$watch("otherModelValue", function () {
                        ngModel.$validate();
                    });
                }
            };
        })
        .directive('formatDate', function () { // Format ASP.NET MVC Date
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelController) {
                    ngModelController.$formatters.push(function (data) {
                        if (data != null)
                            return moment(data).format(OdissBase.dateFormat); // Using moment
                        return data;
                    });
                }
            }
        })
        .directive('checkUsername', ['$q', '$timeout', '$http', function ($q, $timeout, $http) {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelController) {
                    ngModelController.$asyncValidators.username = function (modelValue, viewValue) {
                        if (ngModelController.$dirty) { // Check if the user typed the username
                            if (ngModelController.$isEmpty(modelValue)) {
                                return $q.when();
                            }

                            var def = $q.defer();

                            $timeout(function () {
                                $http({ url: "./users/useralreadyexist", method: "POST", data: { username: modelValue } })
                                    .then(function (result) {
                                        if (result.data) {
                                            def.reject();
                                        }
                                        else {
                                            def.resolve();
                                        }
                                    })
                                    .catch(function () { });
                            }, 600);

                            return def.promise;
                        }

                        return $q.when();
                    };
                }
            };
        }])
        .directive('checkEmail', ['$q', '$timeout', '$http', function ($q, $timeout, $http) {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelController) {
                    ngModelController.$asyncValidators.checkEmail = function (modelValue, viewValue) {

                        if (ngModelController.$dirty) {
                            if (ngModelController.$isEmpty(modelValue)) {
                                return $q.when();
                            }

                            var def = $q.defer();
                            var currentUID = null;

                            if (scope.Editing)
                                currentUID = scope.User.ID;

                            $timeout(function () {
                                $http({ url: "./users/emailalreadyregistered", method: "POST", data: { email: modelValue, currentUID: currentUID } })
                                    .then(function (result) {
                                        if (result.data) {
                                            def.reject();
                                        }
                                        else {
                                            def.resolve();
                                        }
                                    })
                                    .catch(function () { });
                            }, 600);

                            return def.promise;
                        }

                        return $q.when();
                    };
                }
            };
        }])
        .directive("bitMask", function () {
            return {
                restrict: "A",
                require: "ngModel",
                link: function (scope, elem, attrs, ngModelCtrl) {
                    var bitMask = parseInt(scope.$eval(attrs.bitMask));

                    ngModelCtrl.$formatters.push(function (mVal) {
                        return (mVal & bitMask) > 0;
                    });
                    ngModelCtrl.$parsers.push(function (vVal) {
                        var oldValue = ngModelCtrl.$modelValue;
                        return vVal ? oldValue | bitMask : oldValue & ~bitMask;
                    });
                }
            };
        })
        ;
})();