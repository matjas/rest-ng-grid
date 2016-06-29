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
