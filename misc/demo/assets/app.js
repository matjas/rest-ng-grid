angular.module('restNgGrid.demo', ['ngMockE2E', 'ngResource', 'ngRoute','ui.bootstrap', 'restNgGrid']);

angular.module('restNgGrid.demo').
    config(['$locationProvider', '$routeProvider', function config ($locationProvider, $routeProvider){
    $locationProvider.hashPrefix('!');

    $routeProvider.
        when('/tutorial', {
            templateUrl: 'templates/basic-usage.html',
            controller: 'BasicUsage',
            controllerAs: 'basicUsage'
        }).
        when('/tutorial/column', {
            templateUrl: 'templates/columns.html'
        }).
        otherwise('/tutorial')
}]);