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