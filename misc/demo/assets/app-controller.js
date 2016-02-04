angular.module('restNgGrid.demo').controller('MainCtrl',['$scope', 'Resource', 'Http', 'DataModel','$q', '$uibModal', function($scope, Resource, Http, DataModel, $q, $uibModal) {

  // putting our server data on scope to display it for learning purposes
  $scope.dataModel = DataModel;
  // trigger for loading groups
  $scope.load = {groups: false};
  $scope.dataGroups = angular.copy($scope.dataModel.dataGroups);

  $scope.sourceParams = {groupId: null};

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
  $scope.updateGroup = function(item){
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

  $scope.deleteGroup = function(item){
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

  //GRID OPTIONS
  $scope.productsGridOptions = {
    hierarchy: true,
    dataSource: {
      type: "odata",
      transport: {
        get: "",
        query: "/groups/{groupId}/products",
        save: "/groups/{groupId}/products",
        update: "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}/quotationLines/{quotationLineId}",
        "delete": "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}/quotationLines/{quotationLineId}"
      },
      parentId: "groupId",
      itemId: "id",
      childItemId: ""
    },
    isEditable: true,
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
          }
        }, {
          field: ['quantity'],
          colspan: 0,
          style: {
            'width': '20%',
            'text-align': 'right'
          }
        }, {
          field: ['price'],
          colspan: 0,
          style: {
            'width': '20%',
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
      itemId: "id",
      childItemId: "groupId"
    },
    isEditable: true,
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
            'width': '20%'
          }
        },{
          title: 'Price',
          colspan: 0,
          style: {
            'width': '20%'
          }
        }

      ],
      fields: [
        {
          field: 'name',
          colspan: 4
        }
      ]
    }
  };

}]);
