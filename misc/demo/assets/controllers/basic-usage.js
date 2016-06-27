angular.module('restNgGrid.demo').controller('BasicUsage',['$scope', 'Resource', 'Http', 'DataModel','$q', '$uibModal', function($scope, Resource, Http, DataModel, $q, $uibModal) {
  // putting our server data on scope to display it for learning purposes
  $scope.dataModel = DataModel;
  // trigger for loading groups
  $scope.load = {groups: false};
  $scope.dataGroups = angular.copy($scope.dataModel.dataGroups);

  $scope.sourceParams = {groupId: null, productId: null};
  

  //GRID OPTIONS
  $scope.groupsGridOptions = {
    //hierarchy: true,
    // dataSource: {
    //   type: "odata",
    //   transport: {
    //     get: "",
    //     query: "/groups",
    //     save: "/groups",
    //     update: "/groups/{groupId}",
    //     delete: "/groups/{groupId}"
    //   },
    //   //arrayListParam: '',
    //   parentId: "",
    //   itemId: "groupId"
    // },
    columns: {
      titles: [
        {
          title: 'Reference'
        }

      ],
      fields: [
        {
          field: 'name'
        }
      ]
    }
  };

}]);
