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
  angular.module('mjAngularGrid', ['ui.bootstrap', 'ngResource'])
    .constant('mjGridConfig', {
      options: {
        columns: {
          titles: [],
          fields: []
        },
        dataSource: {
          transport:{}
        }
      }
    })
    .factory('dataService', ['$http', '$q', '$resource', function ($http, $q, $resource) {
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
        update: function (url, data) {
          var that = this,
            q = $q.defer();
          $http.put(url, data).then(function successCallback(response) {
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
        }

      }
    }])
    .controller('MjGridController', ['$rootScope', '$scope', '$element', '$attrs', '$compile', '$transclude', 'mjGridConfig', 'dataService', '$modal', '$resource', '$filter', function ($rootScope, $scope, $element, $attrs, $compile, $transclude, mjGridConfig, dataService, $modal, $resource, $filter) {
      // This array keeps track of the columns
      var mjGridCtrl = this;

      this.titleList = [];
      this.columnList = [];
      this.isTranscluded = false;
      this.dataService = dataService;

      this.options = isDefined($scope.options) ? $scope.options : mjGridConfig.options;
      this.apiUrl = this.options.dataSource.transport;
      $scope.items = $scope.items || [];

      var url = "";
      this.orderBy = this.options.columns.orderBy;
      this.parentId = this.options.dataSource.parentId || 'id';
      this.itemId = this.options.dataSource.itemId;

      this.addColumns = function (scope, options) {

        if (options && options.columns && options.columns.titles) {
          forEach(options.columns.titles, function (title) {
            scope.titleList.push(title);
          });
        }
        if (options && options.columns && options.columns.fields) {
          forEach(options.columns.fields, function (field) {
            scope.columnList.push(field);
          });
        }
      };

      //this.manageData = function (value) {
      //  if ($scope.items && isArray($scope.items)) {
      //    console.log($scope.items, 'manage data');
      //    //$scope.items.list;
      //  }
      //};
      //
      //$scope.$watch('items', function (value) {
      //  //console.log(value, 'items changed');
      //  mjGridCtrl.manageData(value);
      //});

      this.closeGroups = function () {
        forEach($scope.items, function (item) {
          item.isOpen = false;
        });
      };

      function clearArray(arr) {
        if(arr){
          while(arr.length > 0){
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
        if(mjGridCtrl.isTranscluded){
          item.isOpen = !item.isOpen;
          if (item.isOpen) {
            if(mjGridCtrl.itemId){
              $scope.params[mjGridCtrl.itemId] = item.id;
            }
            $scope.params = deepMerge(item, $scope.params);
            $rootScope.$broadcast('clickRow', {id: item[mjGridCtrl.parentId]});
          }
        }
      };

      var onRowClickListener = $rootScope.$on('clickRow', function (event, data) {
        if ($scope.$parent.parentItem && $scope.$parent.parentItem.id === data.id) {
          $scope.params = $scope.$parent.params;
          getQuery($scope.params);
        }
      });

      function getQuery(params){
        if($scope.options.dataSource.transport && $scope.options.dataSource.transport.query){
          url = dataService.urlBuilder($scope.options.dataSource.transport.query, params);
          dataService.query(url).then(function (response) {
            if ($scope.options.dataSource.arrayListParam) {
              response = response[$scope.options.dataSource.arrayListParam]
            }
            if (!Array.isArray(response)) {
              response = [response]
            }
            if (mjGridCtrl.orderBy) {
              response = $filter('orderBy')(response, mjGridCtrl.orderBy)
            }
            clearArray($scope.items);
            angular.forEach(response, function(value){
              $scope.items.push(value);
            });
          }, function (response) {
            clearArray($scope.items)
          })
        }
      }

      var onNewRowListener = $rootScope.$on('addNewRow', function (event, data) {
        if ($scope.$parent.parentItem && $scope.$parent.parentItem.id === data.item[mjGridCtrl.parentId]) {
          if (!$scope.items) {
            clearArray($scope.items)
          }
          $scope.items.push(data.item);
        }
      });

      this.addItem = function (item) {
        if($scope.addRow){
          $scope.addRow(item).then(function (result){
            $scope.items.push(result);
          }, function(){
            console.log('handle error');
          });
        } else {
          console.log('add item');
        }
      };

      this.addChildItem = function (item) {
        $scope.addChildRow(item).then(function (item) {
          $rootScope.$broadcast('addNewRow', {item: item});
        }, function () {
          console.log('handle error');
        });
      };

      this.editItem = function (item) {
        if($scope.updateRow){
          $scope.updateRow(item).then(function(result){
            angular.extend(item, result);
          }, function(){
            console.log('save internal');
          });
        } else {
          var url = dataService.urlBuilder(mjGridCtrl.apiUrl.update, $scope.params);
          mjGridCtrl.dataService.update(url, item).then(function (response) {
            angular.extend(item, response.data);
          });
        }
      };

      this.ModalInstanceDelete = function ($scope, $modalInstance, name) {
        $scope.deleteObjectName = name;
        $scope.confirm = function (result) {
          return $modalInstance.close(result);
        };
        return $scope.cancel = function () {
          return $modalInstance.dismiss('cancel');
        };
      };

      this.deleteItem = function (item) {
        mjGridCtrl.deleteRow(item);
      };

      this.deleteRow = function (item) {
        var url = "";
        return $modal.open({
          templateUrl: 'templates/partials/directives/delete.html',
          controller: mjGridCtrl.ModalInstanceDelete,
          animation: false,
          backdrop: true,
          resolve: {
            name: function () {
              return item.name;
            }
          }
        }).result.then(function () {
          $scope.params[mjGridCtrl.itemId] = item.id;
          url = dataService.urlBuilder(mjGridCtrl.apiUrl.delete, $scope.params);
          mjGridCtrl.dataService.delete(url).then(function (response) {
            var idx = $scope.items.indexOf(item);
            if(idx >= 0){
              $scope.items.splice(idx, 1);
            }
          }, function (response) {
            console.log('handle error');
          });
        });
      };

      this.getValue = function (item, prop, filter) {
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
          if (tmpVal) {
            tmpVal = $filter(val.name)(tmpVal, val.format)
          }
        });
        return tmpVal
      };

      $scope.$on('$destroy', onRowClickListener, onNewRowListener);

      //$scope.$on('$destroy', function(){
      //  console.log( $scope.$id,'destroyed scope');
      //  onRowClickListener = null;
      //  onNewRowListener = null;
      //  //$scope.items = []
      //  $scope.$destroy()
      //});


      $scope.$watch('getDataTrigger', function(value){
        if (value) {
          clearArray($scope.items);
          getQuery($scope.params);
          $scope.getDataTrigger = false;
        }
      });

    }])
    .directive('mjGrid', function () {
      return {
        restrict: 'EA',
        transclude: true,
        template: '<div class="mj-grid" data-ng-class="{\'no-title\': mjGridCtrl.titleList.length == 0}">\n  <div class="mj-grid-header">\n    <div class="mj-grid-header-wrap">\n      <table role="grid" data-ng-if="mjGridCtrl.titleList.length > 0" class="table table-responsive out">\n        <thead role="rowgroup">\n        <tr role="row">\n          <th ng-style="{{ t.style }}" colspan="{{ t.colspan }}" role="columnheader"\n              data-ng-repeat="t in mjGridCtrl.titleList">\n            {{ t.title }}\n          </th>\n          <th  class="w-30" data-ng-if="mjGridCtrl.apiUrl.save">\n            <button class="btn btn-primary" ng-click="mjGridCtrl.addItem()">Add item</button>\n          </th>\n        </tr>\n        </thead>\n      </table>\n    </div>\n  </div>\n  <div class="mj-grid-content">\n    <!--{{ $id }}-->\n    <table role="grid" class="table table-responsive out">\n      <tbody role="rowgroup">\n      <tr class="m-master"\n          data-ng-repeat-start="item in items" data-ng-click="mjGridCtrl.toggleRow($event, item)">\n        <td ng-style="{{ c.style }}" colspan="{{ c.colspan }}"\n            data-ng-repeat="c in mjGridCtrl.columnList">\n\t\t\t\t\t<span data-ng-if="mjGridCtrl.isTranscluded && $index == 0" class="sub fa"\n                data-ng-class="{\'fa-plus-square-o\': !item.isOpen, \'fa-minus-square-o\': item.isOpen}"></span>\n          <!--<p data-ng-if="mjGridCtrl.isTranscluded && $index == 0">-->\n          <!--&lt;!&ndash;{{ item }}&ndash;&gt;-->\n          <!--<span><strong>{{ mjGridCtrl.getProperty(item, c.group) }} &nbsp;</strong></span>-->\n          <!--</p>-->\n\t\t\t\t\t<span>\n\t\t\t\t\t\t{{ mjGridCtrl.getValue(item, c.field, c.filter) }}\n\t\t\t\t\t</span>\n        </td>\n        <td class="w-30" data-ng-if="mjGridCtrl.apiUrl.save || mjGridCtrl.apiUrl.update || mjGridCtrl.apiUrl.delete">\n          <div class="dropdown right" dropdown>\n            <a href=""  class="dropdown-toggle" dropdown-toggle>\n              <i class="fa fa-cogs small"></i>\n            </a>\n            <ul class="dropdown-menu extended small">\n              <li data-ng-if="mjGridCtrl.apiUrl.save || updateRow">\n                <a href="" data-ng-click="mjGridCtrl.addChildItem(item)"><span class="fa fa-plus"></span> Add </a>\n              </li>\n              <li data-ng-if="mjGridCtrl.apiUrl.update">\n                <a href="" data-ng-click="mjGridCtrl.editItem(item)"><span class="fa fa-pencil"></span> Edit</a>\n              </li>\n              <li data-ng-if="mjGridCtrl.apiUrl.delete">\n                <a href="" data-ng-click="mjGridCtrl.deleteItem(item)"><span class="fa fa-times"></span>Delete</a>\n              </li>\n            </ul>\n          </div>\n        </td>\n      </tr>\n      <tr data-ng-show="mjGridCtrl.isTranscluded && item.isOpen" class="m-detail"\n          data-ng-repeat-end>\n        <td colspan="{{ mjGridCtrl.titleList.length + 1 }}" my-transclude current-item="item"\n            params="params"></td>\n      </tr>\n      </tbody>\n    </table>\n    <!--<a data-ng-click="mjGridCtrl.checkList()">check</a>-->\n  </div>\n  <div class="mj-grid-footer"></div>\n</div>',
        controller: 'MjGridController',
        controllerAs: 'mjGridCtrl',
        //scope: true,
        scope: {
          options: '=',
          items: '=?',
          params: '=?',
          addRow: '=?',
          addChildRow: '=?',
          updateRow: '=?',
          getDataTrigger: "=?"
        },
        link: function (scope, element, attrs, mjGridCtrl) {
          mjGridCtrl.addColumns(mjGridCtrl, mjGridCtrl.options);
          //mjGridCtrl.manageData();
          //scope.parentItem =  mjGridCtrl.getData();
          //mjGridCtrl.getData();
          //mjGridCtrl.closeGroups();
        }
      }
    })
    .directive('myTransclude', function () {
      function link($scope, element, attributes, mjGridCtrl, transclude) {
        var transcludedContent, transclusionScope;
        if(mjGridCtrl){
          var newScope = $scope.$parent.$parent.$new();
          //put result from isolate to be available to transcluded content
          newScope.parentItem = $scope.$eval(attributes.currentItem);
          newScope.params = $scope.$eval(attributes.params);
          transclude(newScope, function (clone, scope) {
            clone.length > 0 ? mjGridCtrl.isTranscluded = true : mjGridCtrl.isTranscluded = false;
            element.empty();
            element.append(clone);
            transclusionScope = scope;
            transcludedContent = clone;
          });

          element.on('$destroy', function(){
            transcludedContent.remove();
            transclusionScope.$destroy();
          });
        }
      }

      return {
        require: '^?mjGrid',
        link: link,
        restrict: "A"
        //transclude: 'element'
      }
    })
    .directive('mjGridGroup', ['mjGridConfig', 'dataService', '$rootScope', '$resource', '$parse', '$filter', function (mjGridConfig, dataService, $rootScope, $resource, $parse, $filter) {
      var GroupCtrl = function ($scope, $rootScope, $attrs, $element) {
        var mjGridGroupCtrl = this;
        $scope.options = isDefined($attrs.options) ? $scope.$eval($attrs.options) : mjGridConfig.options;
        this.titleList = [];
        this.columnList = [];
        this.apiUrl = $scope.options.dataSource.transport;
        this.orderBy = $scope.options.columns.orderBy;
        $scope.addChildRow = $scope.$eval($attrs.addChildRow);
        $scope.updateRow = $scope.$eval($attrs.updateRow);

      };
      return {
        restrict: 'EA',
        require: '^mjGrid',
        templateUrl: 'templates/partials/directives/mj-grid-inner.html',
        controller: GroupCtrl,
        controllerAs: 'mjGridGroupCtrl',
        link: function (scope, element, attrs, mjGridCtrl) {
          var url = "";
          mjGridCtrl.addColumns(scope.mjGridGroupCtrl, scope.options);

          scope.mjGridGroupCtrl.editItem = function (item) {
            scope.updateRow(item.categoryId, item).then(function (result) {
              if (result && result.id) {
                scope.mjGridGroupCtrl.itemList.forEach(function (element, index) {
                  if (element.id == result.id) {
                    scope.mjGridGroupCtrl.itemList.splice(index, 1, result);
                  }
                });
              }
            }, function (error) {
              console.log('handle error');
            });
          };

          scope.mjGridGroupCtrl.deleteItem = function (item) {
            mjGridCtrl.params.quotationLineId = item.id;
            mjGridCtrl.deleteRow(item, scope.mjGridGroupCtrl);
          };

          scope.mjGridGroupCtrl.getValue = function (item, prop, filter) {
            return mjGridCtrl.getValue(item, prop, filter);
          };

          var onRowClickListener = $rootScope.$on('clickParentRow', function (event, data) {
            if (scope.parentItem && scope.parentItem.id === data.id) {
              url = dataService.urlBuilder(scope.options.dataSource.transport.query, mjGridCtrl.params);
              dataService.query(url).then(function (response) {
                if (scope.options.dataSource.arrayListParam) {
                  response = response[scope.options.dataSource.arrayListParam]
                }
                if (!Array.isArray(response)) {
                  response = [response]
                }
                if (scope.mjGridGroupCtrl.orderBy) {
                  response = $filter('orderBy')(response, scope.mjGridGroupCtrl.orderBy)
                }
                scope.mjGridGroupCtrl.itemList = response;
              }, function (response) {
                scope.mjGridGroupCtrl.itemList = [];
              })
            }
          });
          var onNewRowListener = $rootScope.$on('addNewRow', function (event, data) {
            if (!scope.mjGridGroupCtrl.itemList) {
              scope.mjGridGroupCtrl.itemList = []
            }
            scope.mjGridGroupCtrl.itemList.push(data);
          });
          scope.$on('$destroy', onRowClickListener, onNewRowListener);
        }
      }
    }]);
})(window, window.angular);
