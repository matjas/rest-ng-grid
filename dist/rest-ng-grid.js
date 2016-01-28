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

        var url = "";
        this.orderBy = this.options.columns.orderBy;
        this.parentId = this.options.dataSource.parentId || 'id';
        this.itemId = this.options.dataSource.itemId;
        this.transclusionScope;
        this.transcludedContent;

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
              $scope.items = response;
            }, function (response) {
              $scope.items = [];
            })
          }
        }

        var onNewRowListener = $rootScope.$on('addNewRow', function (event, data) {
          if ($scope.$parent.parentItem && $scope.$parent.parentItem.id === data.item[mjGridCtrl.parentId]) {
            if (!$scope.items) {
              $scope.items = []
            }
            $scope.items.push(data.item);
          }
        });

        this.addItem = function (item) {
          $scope.addRow(item).then(function (item) {
            $rootScope.$broadcast('addNewRow', {item: item});
          }, function () {
            console.log('handle error');
          });
        };

        this.editItem = function (item) {
          $scope.updateRow(item);
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
                mjGridCtrl.transcludedContent.remove();
                mjGridCtrl.transclusionScope.$destroy();
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
          $scope.items = [];
          if (value) {
            getQuery($scope.params);
            $scope.getDataTrigger = false;
          }
        });

      }])
      .directive('mjGrid', function () {
        return {
          restrict: 'EA',
          transclude: true,
          templateUrl: 'rest-ng-grid.html',
          controller: 'MjGridController',
          controllerAs: 'mjGridCtrl',
          //scope: true,
          scope: {
            options: '=',
            items: '=',
            params: '=',
            addRow: '=',
            updateRow: '=',
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
          $scope.addRow = $scope.$eval($attrs.addRow);
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

//# sourceMappingURL=rest-ng-grid.js.map
