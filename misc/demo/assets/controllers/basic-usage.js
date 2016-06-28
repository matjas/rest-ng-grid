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
