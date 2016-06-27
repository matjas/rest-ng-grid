(function (window, angular, undefined) {
  'use strict';
  var isDefined = angular.isDefined,
      isUndefined = angular.isUndefined,
      isFunction = angular.isFunction,
      isString = angular.isString,
      isNumber = angular.isNumber,
      isObject = angular.isObject,
      isArray = angular.isArray,
      forEach = angular.forEach,
      extend = angular.extend,
      copy = angular.copy,
      equals = angular.equals;
  angular.module('restNgGrid', ['ui.bootstrap', 'ngResource'])
      .constant('restNgGridConfig', {
        options: {
          gridUniqueId: null,
          gridClass: '',
          columns: {
            titles: null,
            fields: []
          },
          footer: '',
          childCount: "children",
          childrenParam: "", //show recursively children from json
          editMode: "modal", //"inline", "modal"
          rowOptions: "dropdown", // "inline", "dropdown"
          hierarchy: false, //if true then grid has children with the same parameters (infinite children from API)
          dataSource: {
            transport: {},
            type: 'odb'
          }
        }
      })
      .factory('restNgGridService', ['$http', '$q', '$resource', function ($http, $q, $resource) {
        return {
          urlBuilder: function (urlSchema, params) {
            var url = urlSchema;
            var re = /{[^}]*}/g;
            var keysArray = url.match(re);
            forEach(keysArray, function (value, key) {
              var len = value.length,
                  par = (value.substring(1, len - 1)).split("."),
                  expectedValue = angular.copy(params);
              forEach(par, function (val, key) {
                if (expectedValue) {
                  expectedValue = expectedValue[val];
                }
              });
              url = url.replace(value, expectedValue);
            });
            return url;
          },
          updateChildrenColumn: function(item, columnName){
            var recursiveFn = function(el){
              if(el.children){
                angular.forEach(el.children, function(c){
                  c[columnName] = item[columnName];
                  recursiveFn(c);
                });
              }
            };
            recursiveFn(item);
          },
          query: function (url) {
            var that = this,
                q = $q.defer();
            $http({
              mtehod: 'GET',
              url: url
            }).then(function successCallback(response) {
                  if (response) {
                    q.resolve(response.data)
                  }
                }, function errorCallback(errorMsg) {
                  if (errorMsg) {
                    q.reject([]);
                  }
                }
            );

            return q.promise
          },
          delete: function (url) {
            var that = this,
                q = $q.defer();
            $http.delete(url).then(function successCallback(response) {
                  if (response) {
                    q.resolve(response)
                  }
                }, function errorCallback(response) {
                  if (response) {
                    q.reject(response);
                  }
                }
            );

            return q.promise
          },
          update: function (url, body) {
            var q = $q.defer();
            $http({
              method: 'PUT',
              url: url,
              data: body
            }).then(function successCallback(response) {
                  if (response) {
                    q.resolve(response.data)
                  }
                }, function errorCallback(errorMsg) {
                  if (errorMsg) {
                    q.reject([]);
                  }
                }
            );

            return q.promise
          }
        }
      }])
      .controller('RestNgGridCtrl', ['$rootScope', '$scope', '$element', '$attrs', '$compile',
        'restNgGridConfig', 'restNgGridService', '$uibModal', '$resource', '$filter', '$locale', '$templateCache',
        function ($rootScope, $scope, $element, $attrs, $compile,
                  restNgGridConfig, restNgGridService, $uibModal, $resource, $filter, $locale, $templateCache) {
          // This array keeps track of the columns
          var restNgGridCtrl = this;
          this.gId = guid();

          this.titleList = [];
          this.titleLength = 0;
          this.columnList = [];
          this.isTranscluded = false;
          this.restNgGridService = restNgGridService;
          this.options = {};

          this.inlineMode = {id: null};
          var orgItem = null;

          //isDefined($scope.options) ? angular.extend(this.options, $scope.options) : restNgGridConfig.options;
          this.options = angular.merge({}, restNgGridConfig.options, $scope.options);
          this.apiUrl = this.options.dataSource.transport;
          $scope.items = $scope.items || [];

          var url = "";
          this.orderBy = this.options.columns.orderBy;
          this.parentId = this.options.dataSource.parentId || 'id';
          this.itemId = this.options.dataSource.itemId;

          $scope.currentItem = {id: null};

          $scope.localeId = $locale.id;

          //Generate Guid
          function guid() {
            function s4() {
              return Math.floor((1 + Math.random()) * 0x10000)
                  .toString(16)
                  .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
          }

          this.addColumns = function (scope, options) {
            if (options && options.columns && options.columns.titles) {
              if(angular.isArray(options.columns.titles)){
                forEach(options.columns.titles, function (title) {
                  scope.titleList.push(title);
                });
                scope.titleLength = options.columns.titles.length;
              } else if (angular.isNumber(options.columns.titles)){
                scope.titleLength = options.columns.titles
              }
            }
            if (options && options.columns && options.columns.fields) {
              var fl = '',
                  colspan = 0,
                  style = '',
                  filter = '',
                  type = '',
                  validation = {},
                  visibility = {},
                  isEditable = false,
                  link = '',
                  onChange = false,
                  inputName = '',
                  radioValue = null,
                  changeChildren;

              forEach(options.columns.fields, function (f) {
                fl = f.field || '';
                colspan = f.colspan || 0;
                style = f.style || {'width': 'auto'};
                filter = f.filter || {name: '', format: ''};
                type = f.type || 'text';
                validation = f.validation || {required: false};
                visibility = f.visibility || {bitMask: null, field: []};
                isEditable = f.isEditable || false;
                link = f.link || '';
                onChange = f.onChange || false;
                inputName = f.inputName || 'mj-input';
                radioValue = f.radioValue || null;
                changeChildren = f.changeChildren || false;

                scope.columnList.push({
                  field: fl,
                  colspan: colspan,
                  style: style,
                  filter: filter,
                  type: type,
                  validation: validation,
                  visibility: visibility,
                  isEditable: isEditable,
                  link: link,
                  onChange: onChange,
                  inputName: inputName,
                  radioValue: radioValue,
                  changeChildren: changeChildren
                });
              });
            }
          };

          this.closeGroups = function () {
            forEach($scope.items, function (item) {
              item.isOpen = false;
            });
          };

          function clearArray(arr) {
            if (arr) {
              while (arr.length > 0) {
                arr.pop();
              }
              return arr;
            }
          }

          function deepMerge(src, dst) {
            var i;
            for (i in dst) {
              if (src.hasOwnProperty(i)) {
                if (angular.isObject(src[i])) {
                  //dst[i] = angular.isArray(dst[i]) ? [] : {};
                  deepMerge(src[i], dst[i])
                } else {
                  if (src) {
                    dst[i] = src[i]
                  }
                }
              }
            }
            return dst;
          }

          this.toggleRow = function (e, item) {
            if (e) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
            if (restNgGridCtrl.isTranscluded) {
              item.isOpen = !item.isOpen;
            }
            if (angular.isFunction($scope.selectItem)) {
              $scope.selectItem(item);
            }
            $rootScope.$broadcast('selectRow', {id: item.id, gId: restNgGridCtrl.gId});
            if (item.isOpen) {
              if (restNgGridCtrl.itemId) {
                $scope.params[restNgGridCtrl.itemId] = item.id;
              }
              if ($scope.options.dataSource.type == 'tree') {
                $rootScope.$broadcast('expandRow', item);
              } else {
                $scope.params = deepMerge(item, $scope.params);
                $rootScope.$broadcast('expandRow', {id: item.id, gId: restNgGridCtrl.gId});
              }
            }

          };

          this.selectRow = function (e, item, column) {
            if (e && !column && !column.link) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
            $scope.currentItem.id = item.id;
            if (angular.isFunction($scope.selectItem)) {
              $scope.selectItem(item);
            }
            $rootScope.$broadcast('selectRow', {id: item.id, gId: restNgGridCtrl.gId});
          };

          var onExpandRowListener = $rootScope.$on('expandRow', function (event, data) {

            if ($scope.$parent.parentItem && $scope.$parent.parentItem.id === data.id && $scope.$parent.parentItem.gId === data.gId) {
              $scope.params = $scope.$parent.params;
              getQuery($scope.params, data);
            }
          });

          var onSelectRowListener = $rootScope.$on('selectRow', function (event, data) {
            if (restNgGridCtrl.gId == data.gId) {
              $scope.currentItem.id = data.id
            } else {
              $scope.currentItem.id = null;
            }
          });

          function getQuery(params, data) {
            if ($scope.options.dataSource.transport && $scope.options.dataSource.transport.query) {
              url = restNgGridService.urlBuilder($scope.options.dataSource.transport.query, params);
              restNgGridService.query(url).then(function (response) {
                if ($scope.options.dataSource.arrayListParam) {
                  response = response[$scope.options.dataSource.arrayListParam]
                }
                if (!Array.isArray(response)) {
                  response = [response]
                }
                if (restNgGridCtrl.orderBy) {
                  response = $filter('orderBy')(response, restNgGridCtrl.orderBy)
                }
                clearArray($scope.items);
                angular.forEach(response, function (value) {
                  $scope.items.push(value);
                });
              }, function (response) {
                clearArray($scope.items)
              })
            } else if ($scope.options.dataSource.type == 'tree') { //when classic tree list with children dependencies
              clearArray($scope.items);
              angular.forEach(data.children, function (value) {
                $scope.items.push(value);
              });
            }
          }

          var onNewRowListener = $rootScope.$on('addNewRow', function (event, data) {
            if ($scope.$parent.parentItem && $scope.$parent.parentItem.id === data.item[restNgGridCtrl.parentId]) {
              if (restNgGridCtrl.options.gridUniqueId && restNgGridCtrl.options.gridUniqueId === data.gridUniqueId) {
                $scope.items.push(data.item);
              } else if (!restNgGridCtrl.options.gridUniqueId) {
                $scope.items.push(data.item);
              }
            }
          });

          this.addItem = function (item) {
            restNgGridCtrl.inlineMode.id = null;
            orgItem = null;
            if ($scope.addRow) {
              $scope.addRow(item).then(function (item) {
                if ($scope.options.dataSource.transport.query) {
                  if (!angular.isArray($scope.items)) {
                    $scope.items = [$scope.items]
                  }
                  if (item) {
                    $scope.items.push(item);
                  }
                }
              }, function (error) {

              });
            }
          };

          this.addChildItem = function (item) {
            restNgGridCtrl.inlineMode.id = null;
            orgItem = null;
            $scope.addChildRow(item).then(function (itemChild) {
              restNgGridCtrl.toggleRow(null, item);
              item[restNgGridCtrl.options.childCount] = item[restNgGridCtrl.options.childCount] + 1;
              restNgGridCtrl.selectRow(null, item);
              $rootScope.$broadcast('addNewRow', {item: itemChild});
            }, function () {
              console.log('handle error');
            });
          };

          this.editItem = function (item) {
            $scope.params[restNgGridCtrl.itemId] = item.id;
            $scope.params[restNgGridCtrl.parentId] = item[restNgGridCtrl.parentId];
            if (restNgGridCtrl.options.editMode == 'inline') {
              restNgGridCtrl.inlineMode.id = item.id;
              orgItem = angular.copy(item)
            }
            if ($scope.updateRow && restNgGridCtrl.options.editMode == 'modal') {
              updateRowExternal(item);
            }
          };

          function updateRowExternal(item) {
            $scope.updateRow(item).then(function (updatedItem) {
              angular.extend(item, updatedItem);
              restNgGridCtrl.inlineMode.id = null;
            }, function (error) {
              restNgGridCtrl.cancelEditMode(item);
            })
          }

          this.saveRow = function (item, e) {
            $scope.params[restNgGridCtrl.itemId] = item.id;
            $scope.params[restNgGridCtrl.parentId] = item[restNgGridCtrl.parentId];
            if ($scope.updateRow) {
              updateRowExternal(item);
            } else {
              url = restNgGridService.urlBuilder(restNgGridCtrl.apiUrl.update, $scope.params);
              restNgGridCtrl.restNgGridService.update(url, item).then(function (response) {
                angular.extend(item, response);
                restNgGridCtrl.inlineMode.id = null;
              }, function (response) {
                restNgGridCtrl.cancelEditMode(item);
              });
            }
          };

          this.cancelEditMode = function (item) {
            restNgGridCtrl.inlineMode.id = null;
            angular.extend(item, orgItem);
            orgItem = null;
          };


          this.ModalInstanceDelete = function ($scope, $uibModalInstance, name) {
            $scope.deleteObjectName = name;
            $scope.confirm = function (result) {
              return $uibModalInstance.close(result);
            };
            return $scope.cancel = function () {
              return $uibModalInstance.dismiss('cancel');
            };
          };

          this.deleteItem = function (item) {
            restNgGridCtrl.deleteRow(item);
          };

          this.deleteRow = function (item) {
            var url = "";
            return $uibModal.open({
              template: $templateCache.get('rest-ng-grid-delete.html'),
              controller: restNgGridCtrl.ModalInstanceDelete,
              animation: false,
              backdrop: true,
              resolve: {
                name: function () {
                  return item.name;
                }
              }
            }).result.then(function () {
              $scope.params[restNgGridCtrl.itemId] = item.id;
              $scope.params[restNgGridCtrl.parentId] = item[restNgGridCtrl.parentId];
              url = restNgGridService.urlBuilder(restNgGridCtrl.apiUrl.delete, $scope.params);
              restNgGridCtrl.restNgGridService.delete(url).then(function (response) {
                var idx = $scope.items.indexOf(item);
                if (idx >= 0) {
                  $scope.items.splice(idx, 1);
                }
              }, function (response) {
                console.log('handle error');
              });
            });
          };

          this.getValue = function (item, prop, filter, visibility) {
            var tmpVal = item,
                visibilityField = null;
            if (!angular.isArray(prop)) {
              prop = [prop]
            }
            if (visibility) {
              if (!angular.isArray(visibility.field)) {
                visibility.field = [visibility.field];
              }

              angular.forEach(visibility.field, function (val) {
                visibilityField = tmpVal[val];
              });
              if (visibilityField && !(visibility.bitMask & visibilityField)) {
                return ''
              }
            }

            if (filter && !angular.isArray(filter)) {
              filter = [filter]
            }
            angular.forEach(prop, function (val) {
              if (tmpVal) {
                tmpVal = tmpVal[val]
              }
            });
            angular.forEach(filter, function (val) {
              if (tmpVal && val.name && val.format) {
                tmpVal = $filter(val.name)(tmpVal, val.format)
              }
            });
            return tmpVal
          };

          function cellEditable(item, column) {
            var isEditable = false,
                tmpVal = item;
            if (angular.isObject(column.isEditable)) {
              if (column.isEditable.path) {
                angular.forEach(column.isEditable.path, function (val) {
                  if (tmpVal) {
                    tmpVal = tmpVal[val]
                  }
                });
                if (column.isEditable.trueValue == tmpVal) {
                  isEditable = true;
                }
              } else {
                isEditable = false;
              }
            } else {
              isEditable = column.isEditable;
            }
            return isEditable;
          }

          //edit mode or content
          this.checkIfContent = function (item, column) {
            var isEditable = cellEditable(item, column);
            return (restNgGridCtrl.inlineMode.id !== item.id && !$scope.editAllRows) || !isEditable;
          };

          this.checkIfEdit = function (item, column) {
            var isEditable = cellEditable(item, column);
            return (restNgGridCtrl.inlineMode.id == item.id || $scope.editAllRows) && isEditable;
          };

          this.checkIfRowEditable = function (item) {
            var isEditable = false;
            angular.forEach(restNgGridCtrl.columnList, function (column) {
              if (!isEditable) {
                isEditable = cellEditable(item, column);
              }
            });
            return isEditable;
          };
          this.changeCellEvent = function (item, column) {
            if (column.onChange) {
              column.onChange(item);
            }
            if(column.changeChildren && $scope.options.dataSource.type !== 'tree'){
              $scope.$broadcast('changeChildren', {item: item, column: column})
            } else if(column.changeChildren){
              restNgGridService.updateChildrenColumn(item, column.field);
            }
          };
          //end edit mode or content

          this.onCellLinkClick = function (item, field, fn) {
            fn(item[field]);
          };

          $scope.$watch('getDataTrigger', function (value) {
            if (value) {
              clearArray($scope.items);
              getQuery($scope.params, value);
              $scope.getDataTrigger = false;
            }
          });

          $scope.$watch('getExpandRowTrigger', function (id) {
            if (id) {
              restNgGridCtrl.selectRow(null, {id: id});
            }
          });

          var onEditTriggerListener = $rootScope.$on('editTriggerHandler', function (event, data) {
            if (data.type == 'all') {
              $scope.editAllRows = data.status
            }
          });
          var onChangeChildrenTriggerListener = $scope.$on('changeChildren', function (event, data) {
            //handle change children if no tree
          });

          $scope.editTrigger = function (data) {
            if (data.type == 'all') {
              $rootScope.$broadcast('editTriggerHandler', {type: data.type, status: data.status});
            }
          };

          $scope.$on('$localeChangeSuccess', function (e) {
            $scope.localeId = $locale.id;
          });

          $scope.$on('$destroy', onExpandRowListener, onNewRowListener, onEditTriggerListener, onSelectRowListener, onChangeChildrenTriggerListener);

          //$scope.$on('$destroy', function(){
          //  console.log( $scope.$id,'destroyed scope');
          //  onExpandRowListener = null;
          //  onNewRowListener = null;
          //  //$scope.items = []
          //  $scope.$destroy()
          //});


        }])
      .directive('restNgGrid', ['$compile', '$templateCache', function ($compile, $templateCache) {
        return {
          restrict: 'EA',
          transclude: true,
          template: $templateCache.get('rest-ng-grid.html'),
          controller: 'RestNgGridCtrl',
          controllerAs: 'restNgGridCtrl',
          //scope: true,
          scope: {
            options: '=?',
            items: '=?',
            params: '=?',
            addRow: '=?',
            addChildRow: '=?',
            updateRow: '=?',
            getDataTrigger: "=?",
            editTrigger: "=?",
            gridClass: "@",
            footerOptions: "=?",
            selectItem: "=?",
            isReadOnly: "=?",
            getExpandRowTrigger: "=",
            editAllRows: "="
          },
          link: function (scope, element, attrs, restNgGridCtrl) {
            restNgGridCtrl.addColumns(restNgGridCtrl, restNgGridCtrl.options);
            //restNgGridCtrl.manageData();
            //scope.parentItem =  restNgGridCtrl.getData();
            //restNgGridCtrl.getData();
            //restNgGridCtrl.closeGroups();
            function applyFooter() {
              var footer = angular.element(restNgGridCtrl.options.footer);
              //angular.element($element).html(tpl1);
              //$compile($element.contents())($scope);

            }
          }
        }
      }])
      .directive('restNgGridTransclude', ['$templateCache', '$compile', function ($templateCache, $compile) {
        function link($scope, element, attributes, restNgGridCtrl, transclude) {
          var transcludedContent, transclusionScope;
          if (restNgGridCtrl) {
            var newScope = $scope.$parent.$parent.$new();
            //put result from isolate to be available to transcluded content
            newScope.parentItem = $scope.$eval(attributes.currentItem);
            newScope.parentItem.gId = restNgGridCtrl.gId;
            newScope.params = $scope.$eval(attributes.params);
            transclude(newScope, function (clone, scope) {
              //var content = null
              element.empty();


              clone.length > 0 ? restNgGridCtrl.isTranscluded = true : restNgGridCtrl.isTranscluded = false;
              element.append(clone);
              transcludedContent = clone;
              transclusionScope = scope;
            });

          }
          element.on('$destroy', function () {
            transcludedContent.remove();
            transclusionScope.$destroy();
          });
        }

        return {
          require: '^?restNgGrid',
          link: link,
          restrict: "A"
          //transclude: 'element'
        }
      }])

      .directive('restGridChildren', ['$templateCache', function ($templateCache) {
        return {
          restrict: 'E',
          replace: true,
          template: $templateCache.get('rest-ng-grid-select-group.html'),
          scope: {
            collection: '=?',
            options: "=?",
            field: "=",
            filter: "="
          },
          link: function ($scope, element, attributes) {
            if ($scope.collection) {
              if (!angular.isArray($scope.collection)) {
                $scope.collection = [$scope.collection];
              }
            }
            $scope.setValue = function (item, prop, filter) {
              var tmpVal = item;
              if (!angular.isArray(prop)) {
                prop = [prop]
              }
              if (filter && !angular.isArray(filter)) {
                filter = [filter]
              }
              angular.forEach(prop, function (val) {
                if (tmpVal) {
                  tmpVal = tmpVal[val]
                }
              });
              angular.forEach(filter, function (val) {
                if (tmpVal && val.name && val.format) {
                  tmpVal = $filter(val.name)(tmpVal, val.format)
                }
              });
              return tmpVal
            };
          }
        }
      }])

})(window, window.angular);

