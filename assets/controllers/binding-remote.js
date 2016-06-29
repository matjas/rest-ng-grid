angular.module('restNgGrid.demo').controller('BindingRemote', ['$scope', 'Resource', 'Http', 'DataModel', '$q', '$uibModal', function ($scope, Resource, Http, DataModel, $q, $uibModal) {
    // putting our server data on scope to display it for learning purposes
    $scope.dataModel = DataModel;

    $scope.dataGroups = angular.copy($scope.dataModel.dataGroups);

    $scope.load = {groups: false};

    //Fill grid
    $scope.getGroups = function(){
        // trigger for loading data
        $scope.load.groups = true;
    };

    //GRID OPTIONS
    $scope.groupsGridOptions = {
        dataSource: {
            transport: {
                query: "/groups"
            }
        },
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
