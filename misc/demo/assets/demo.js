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


angular.module('restNgGrid.demo', ['ngMockE2E', 'ngResource', 'ngRoute', 'ui.bootstrap', 'restNgGrid', 'plunker', 'bootstrapPrettify']);

angular.module('restNgGrid.demo').config(['$locationProvider', '$routeProvider', function config($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');

    $routeProvider.when('/tutorial', {
        templateUrl: 'templates/basic-usage.html',
        controller: 'BasicUsage',
        controllerAs: 'basicUsage'
    }).when('/tutorial/column', {
        templateUrl: 'templates/columns.html'
    }).when('/tutorial/binding/local', {
        templateUrl: 'templates/binding-local.html',
        controller: 'BindingLocal',
        controllerAs: 'bindingLocal'
    }).otherwise('/tutorial')
}]);

directive.ngHtmlWrapGrid = ['reindentCode', 'templateMerge', function (reindentCode, templateMerge) {
    return {
        compile: function (element, attr) {
            var properties = {
                    head: '',
                    module: '',
                    body: element.text()
                },
                html = "<!doctype html>\n<html ng-app{{module}}>\n  <head>\n{{head:4}}  </head>\n  <body>\n{{body:4}}  </body>\n</html>";

            angular.forEach((attr.ngHtmlWrap || '').split(' '), function (dep) {
                if (!dep) return;
                dep = DEPENDENCIES[dep] || dep;

                var ext = dep.split(/\./).pop();

                if (ext == 'css') {
                    properties.head += '<link rel="stylesheet" href="' + dep + '" type="text/css">\n';
                } else if (ext == 'js') {
                    properties.head += '<script src="' + dep + '"></script>\n';
                } else {
                    properties.module = '="' + dep + '"';
                }
            });

            setHtmlIe8SafeWay(element, escape(templateMerge(html, properties)));
        }
    }
}];
angular.module('restNgGrid.demo').run(function($httpBackend, DataModel) {

  $httpBackend.whenGET('/groups').respond(function(method, url, data) {
    var groups = DataModel.findAll();
    return [200, groups, {}];
  });

  //$httpBackend.whenGET(/\/groups\/\d+/).respond(function(method, url, data) {
  //  // parse the matching URL to pull out the id (/groups/:id)
  //  var groupId = url.split('/')[2];
  //
  //  var group = DataModel.findOne(groupId);
  //
  //  return [200, group, {}];
  //});

  // this is the creation of a new resource
  $httpBackend.whenPOST('/groups').respond(function(method, url, data) {
    var params = angular.fromJson(data);

    var group = DataModel.addGroupHttp(params);

    // get the id of the new resource to populate the Location field
    var groupId = group.groupId;

    return [201, group, { Location: '/groups/' + groupId }];
  });

  $httpBackend.whenPUT(/\/groups\/\d+$/).respond(function(method, url, data) {
    var params = angular.fromJson(data);

    // parse the matching URL to pull out the id (/groups/:id)
    var groupId = url.split('/')[2];
    var group = DataModel.updateGroup(params);
    return [201, group, { Location: '/groups/' + groupId }];
  });


  $httpBackend.whenDELETE(/\/groups\/\d+$/).respond(function(method, url, data) {
    // parse the matching URL to pull out the id (/groups/:id)
    var groupId = url.split('/')[2];

    DataModel.deleteGroup(groupId);

    return [204, {}, {}];
  });

  //PRODUCTS
  $httpBackend.whenGET(/\/groups\/\d+\/products$/).respond(function(method, url, data) {
    // parse the matching URL to pull out the id (/groups/:id/products)
    var groupId = url.split('/')[2];

    var products = DataModel.findAllProducts(groupId);

    return [200, products, {}];
  });

  $httpBackend.whenPOST(/\/groups\/\d+\/products$/).respond(function(method, url, data) {
    var params = angular.fromJson(data);

    var groupId = url.split('/')[2];
    var product = DataModel.addProductHttp(groupId, params);

    return [201, product, { Location: '/groups/' + groupId + '/products'}];
  });

  $httpBackend.whenPUT(/\/groups\/\d+\/products\/\d+$/).respond(function(method, url, data) {
    var params = angular.fromJson(data);

    // parse the matching URL to pull out the id (/groups/:id/products/:id)
    var groupId = url.split('/')[2];
    var productId = url.split('/')[4];
    var product = DataModel.updateProduct(params);
    return [201, product, { Location: '/groups/' + groupId + '/products/' + productId}];
  });

  $httpBackend.whenDELETE(/\/groups\/\d+\/products\/\d+$/).respond(function(method, url, data) {
    // parse the matching URL to pull out the id (/groups/:id/products/:id)
    var groupId = url.split('/')[2];
    var productId = url.split('/')[4];

    DataModel.deleteProduct(groupId, productId);

    return [204, {}, {}];
  });



  //$httpBackend.whenGET(/rest-ng-grid/).passThrough();
  $httpBackend.whenGET(/^templates/).passThrough();


});

angular.module('restNgGrid.demo').controller('MainCtrl',['$scope', 'Resource', 'Http', 'DataModel','$q', '$uibModal', function($scope, Resource, Http, DataModel, $q, $uibModal) {

  
}]);

angular.module('restNgGrid.demo').controller('BasicUsage', ['$scope', 'Resource', 'Http', 'DataModel', '$q', '$uibModal', function ($scope, Resource, Http, DataModel, $q, $uibModal) {
    // putting our server data on scope to display it for learning purposes
    $scope.dataModel = DataModel;

    $scope.dataGroups = angular.copy($scope.dataModel.dataGroups);

    //GRID OPTIONS
    $scope.groupsGridOptions = {
        columns: {
            titles: [
                {
                    title: 'Name'
                },
                {
                    title: 'Reference'
                }

            ],
            fields: [
                {
                    field: 'name'
                },
                {
                    field: 'reference'
                }
            ]
        }
    };

}]);

angular.module('restNgGrid.demo').controller('BindingLocal', ['$scope', 'Resource', 'Http', 'DataModel', '$q', '$uibModal', function ($scope, Resource, Http, DataModel, $q, $uibModal) {
    // putting our server data on scope to display it for learning purposes
    $scope.dataModel = DataModel;

    $scope.dataGroups = angular.copy($scope.dataModel.dataGroups);

    //GRID OPTIONS
    $scope.groupsGridOptions = {
        columns: {
            titles: [
                {
                    title: 'Name'
                },
                {
                    title: 'Reference'
                }

            ],
            fields: [
                {
                    field: 'name'
                },
                {
                    field: 'reference'
                }
            ]
        }
    };

}]);

/**
 * Created by maciejjaskula on 27.06.2016.
 */
angular.module('restNgGrid.demo').controller('Hierarchy',['$scope', 'Resource', 'Http', 'DataModel','$q', '$uibModal', function($scope, Resource, Http, DataModel, $q, $uibModal) {
    // putting our server data on scope to display it for learning purposes
    $scope.dataModel = DataModel;
    // trigger for loading groups
    $scope.load = {groups: false};
    $scope.dataGroups = angular.copy($scope.dataModel.dataGroups);

    $scope.sourceParams = {groupId: null, productId: null};

    //Fill grid
    $scope.getGroups = function(){
        $scope.load.groups = true;
    };

    //Add new group
    $scope.addNewGroup = function(){
        var q = $q.defer();
        $scope.dataModel.addGroup().then(function(result){
            q.resolve(result);
        });
        return q.promise;
    };

    //Update group
    $scope.updateGroup = function(item, params){
        var q = $q.defer();
        var updatedItem = $scope.dataModel.updateGroup(item);
        q.resolve(updatedItem);
        return q.promise;
    };

    //Delete group
    $scope.ModalInstanceDelete = function ($scope, $uibModalInstance, name) {
        $scope.deleteObjectName = name;
        $scope.confirm = function (result) {
            return $uibModalInstance.close(result);
        };
        return $scope.cancel = function () {
            return $uibModalInstance.dismiss('cancel');
        };
    };

    $scope.deleteGroup = function(item, params){
        var q = $q.defer();
        $uibModal.open({
            templateUrl: 'templates/delete.html',
            controller: $scope.ModalInstanceDelete,
            animation: false,
            backdrop: true,
            resolve: {
                name: function () {
                    return item.name;
                }
            }
        }).result.then(function () {
            q.resolve($scope.dataModel.deleteGroup(item.id));
        }, function(){
            q.reject(false);
        });
        return q.promise;
    };

    //PRODUCTS
    $scope.addProduct = function(parentItem){
        var q = $q.defer();
        $scope.dataModel.addProduct(parentItem.id).then(function(result){
            q.resolve(result);
        });
        return q.promise;
    };

    //Update product
    $scope.updateProduct = function(item, params){
        var q = $q.defer();
        var updatedItem = $scope.dataModel.updateProduct(item);
        q.resolve(updatedItem);
        return q.promise;
    };

    $scope.deleteProduct = function(item, params){
        var q = $q.defer();
        $uibModal.open({
            templateUrl: 'templates/delete.html',
            controller: $scope.ModalInstanceDelete,
            animation: false,
            backdrop: true,
            resolve: {
                name: function () {
                    return item.name;
                }
            }
        }).result.then(function () {
            q.resolve($scope.dataModel.deleteProduct(null, item.id));
        }, function(){
            q.reject(false);
        });
        return q.promise;
    };

    //GRID OPTIONS
    $scope.productsGridOptions = {
        hierarchy: true,
        dataSource: {
            type: "odata",
            transport: {
                get: "",
                query: "/groups/{groupId}/products",
                save: "/groups/{groupId}/products",
                update: "/groups/{groupId}/products/{productId}",
                delete: "/groups/{groupId}/products/{productId}"
            },
            parentId: "groupId",
            itemId: "productId"
        },
        isEditable: true,
        editMode: "inline",
        rowOptions: "inline",
        columns: {

            /*titles: [
             {
             title: 'Destination'
             colspan: 0
             }

             ]
             */
            fields: [
                {
                    field: ['reference'],
                    colspan: 0,
                    style: {
                        'width': '30%'
                    }
                }, {
                    field: ['name'],
                    colspan: 0,
                    style: {
                        'width': '30%'
                    },
                    type: 'text',
                    validation: {required: true},
                    isEditable: true
                }, {
                    field: ['quantity'],
                    colspan: 0,
                    style: {
                        'width': '15%',
                        'text-align': 'right'
                    },
                    type: 'number',
                    validation: {required: true, min: 0, step: 1},
                    isEditable: true
                }, {
                    field: ['price'],
                    colspan: 0,
                    style: {
                        'width': '15%',
                        'text-align': 'right'
                    }
                }
            ]
        }
    };
    $scope.groupsGridOptions = {
        hierarchy: true,
        dataSource: {
            type: "odata",
            transport: {
                get: "",
                query: "/groups",
                save: "/groups",
                update: "/groups/{groupId}",
                delete: "/groups/{groupId}"
            },
            //arrayListParam: '',
            parentId: "",
            itemId: "groupId"
        },
        isEditable: true,
        editMode: "inline",
        rowOptions: "inline",
        columns: {
            titles: [
                {
                    title: 'Reference',
                    colspan: 0,
                    style: {
                        'width': '30%'
                    }
                }, {
                    title: 'Name',
                    colspan: 0,
                    style: {
                        'width': '30%'
                    }
                }, {
                    title: 'Qte',
                    colspan: 0,
                    style: {
                        'width': '15%'
                    }
                },{
                    title: 'Price',
                    colspan: 0,
                    style: {
                        'width': '15%'
                    }
                }

            ],
            fields: [
                {
                    field: 'name',
                    colspan: 4,
                    type: 'text',
                    validation: {required: true},
                    isEditable: true
                }
            ]
        }
    };

}]);

angular.module('restNgGrid.demo').service('DataModel',[ '$timeout', '$q', function DataModel($timeout, $q) {

  //options
  this.dataGroups = [
    {
      id: 1,
      name: "RTV",
      reference: "Ref1"
    },
    {
      id: 2,
      name: "AGD",
      reference: "Ref2"
    },
    {
      id: 3,
      name: "Computers",
      reference: "Ref3"
    }
  ];
  this.dataGroupProducts = [
    {
      id: 1,
      groupId: '1',
      reference: 'REF-1-1',
      name: "Samsung TV",
      quantity: 5,
      price: 566
    },
    {
      id: 2,
      groupId: '1',
      reference: 'REF-1-2',
      name: "Panasonic TV",
      quantity: 10,
      price: 899
    },
    {
      id: 3,
      groupId: '1',
      reference: 'REF-1-3',
      name: "Sony TV",
      quantity: 14,
      price: 550
    },
    {
      id: 4,
      groupId: '2',
      reference: 'REF-2-1',
      name: "Samsung Washing Machine",
      quantity: 5,
      price: 566
    },
    {
      id: 5,
      groupId: '2',
      reference: 'REF-2-2',
      name: "Indesit Washing Machine",
      quantity: 10,
      price: 899
    },
    {
      id: 6,
      groupId: '2',
      reference: 'REF-2-3',
      name: "Hotpoint Fridge",
      quantity: 14,
      price: 550
    },
    {
      id: 7,
      groupId: '3',
      reference: 'REF-3-1',
      name: "Mack Book Pro",
      quantity: 5,
      price: 2100
    },
    {
      id: 8,
      groupId: '3',
      reference: 'REF-3-1',
      name: "Mac Book Air",
      quantity: 10,
      price: 1500
    },
    {
      id: 9,
      groupId: '3',
      reference: 'REF-3-3',
      name: "Dell pro",
      quantity: 14,
      price: 1600
    }

  ];

  this.getData = function() {
    return this.dataGroups;
  };

  this.setData = function(data) {
    this.dataGroups = data;
  };

  this.addGroup = function(){
    var q = $q.defer(),
        that = this,
        newId = this.newId(that.dataGroups);
    $timeout(function(){
      var newGroup = {
        id: newId,
        name: 'NewGroup' + newId
      };
      that.dataGroups.push(newGroup);
      q.resolve(newGroup);
    },500);
    return q.promise
  };

  // add a new data item that does not exist already
  // must compute a new unique id and backfill in
  this.addGroupHttp = function(dataItem) {
    // must calculate a unique ID to add the new data
    var newId = this.newId(this.dataGroups);
    dataItem = {name: 'NewGroup', id: null};
    dataItem.id = newId;
    this.dataGroups.push(dataItem);
    //this.dataGroups.push(dataItem);
    return dataItem;
  };

  this.findOne = function(groupId) {
    // find the group that matches that id
    var list = $.grep(this.getData(), function(element, index) {
      return (element.id == groupId);
    });
    if(list.length === 0) {
      return {};
    }
    // even if list contains multiple items, just return first one
    return list[0];
  };

  this.findAll = function() {
    return this.getData();
  };

  // options parameter is an object with key value pairs
  // in this simple implementation, value is limited to a single value (no arrays)
  this.findMany = function(options) {
    // find games that match all of the options
    var list = $.grep(this.getData(), function(element, index) {
      var matchAll = true;
      $.each(options, function(optionKey, optionValue) {
        if(element[optionKey] != optionValue) {
          matchAll = false;
          return false;
        }
      });
      return matchAll;
    });
  };

  this.updateGroup = function(dataItem) {
    // find the game that matches that id
    var groups = this.getData();
    var match = null;

    for (var i=0; i < groups.length; i++) {
      if(groups[i].id == dataItem.id) {
        match = groups[i];
        break;
      }
    }
    if(!angular.isObject(match)) {
      return {}
    }
    angular.extend(match, dataItem);
    return match;
  };

  this.deleteGroup = function(groupId) {
    var groups = this.getData();
    var match = false;
    for (var i=0; i < groups.length; i++) {
      if(groups[i].id == groupId) {
        match = true;
        groups.splice(i, 1);
        break;
      }
    }
    return match;
  };

  // Products
  this.getProductList = function() {
    return this.dataGroupProducts;
  };

  this.findAllProducts = function(groupId) {
    return _.filter(this.dataGroupProducts, {groupId: groupId});
  };

  this.addProductHttp = function(groupId, dataItem) {
    // must calculate a unique ID to add the new data
    var newId = this.newId(this.dataGroupProducts);
    dataItem = {id: newId, name: 'NewProduct', groupId: groupId, reference: "REF-NEW", quantity: 10, price: 222};
    dataItem.id = newId;
    this.dataGroupProducts.push(dataItem);
    return dataItem;
  };

  this.addProduct = function(groupId){
    var q = $q.defer(),
      that = this,
      newId = this.newId(this.dataGroupProducts);
    $timeout(function(){
      var newProduct = {id: newId, name: 'NewProduct', groupId: groupId, reference: "REF-NEW", quantity: 10, price: 222};
      that.dataGroupProducts.push(newProduct);
      q.resolve(newProduct);
    },500);
    return q.promise
  };

  this.updateProduct = function(dataItem) {
    // find the game that matches that id
    var products = this.getProductList();
    var match = null;
    
    for (var i=0; i < products.length; i++) {
      if(products[i].id == dataItem.id) {
        match = products[i];
        break;
      }
    }
    if(!angular.isObject(match)) {
      return {}
    }
    angular.extend(match, dataItem);
    return match;
  };

  this.deleteProduct = function(groupId, productId) {
    var products = this.getProductList();
    var match = null;
    for (var i=0; i < products.length; i++) {
      if(products[i].id == productId) {
        match = true;
        products.splice(i, 1);
        break;
      }
    }
    return match;
  };

  //Helpers
  // return an id to insert a new data item at
  this.newId = function(collection) {
    var lastId = getLastId(collection);
    // increment by one
    return lastId + 1;
  };

  function getLastId(collection) {
    var lastId = 0;
    _.forEach(collection, function(elm){
      if(elm.id > lastId){
        lastId = elm.id;
      }
    });
    return lastId;
  }

}]);

angular.module('restNgGrid.demo').factory('Http', function($http) {
  var service = {
    query: function() {
      return $http.get('/groups');

    },
    get: function(id) {
      return $http.get('/groups/' + id);
    },
    save: function(data) {
      if(angular.isDefined(data.groupId)) {
        return $http.post('/groups/' + data.groupId, data);
      } else {
        return $http.post('/groups', data);
      }
    },
    delete: function(id) {
      return $http.delete('/groups/' + id);
    }
  };

  return service;
})

angular.module('restNgGrid.demo').factory('Resource', function($resource) {
  return $resource('/groups/:groupId', {groupId: '@groupId'});
});
