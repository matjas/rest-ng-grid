angular.module('restNgGrid.demo', ['ngRoute', 'ngResource', 'ngTouch', 'ngAnimate', 'ngSanitize','ui.bootstrap', 'mjAngularGrid'], function($httpProvider){

}).run(['$location', function($location){


}]).controller('MainCtrl', MainCtrl);

function MainCtrl($scope, $http, $document) {
  $scope.linesGridOptions = {
    hierarchy: true,
    dataSource: {
      type: "odata",
      transport: {
        get: "",
        query: "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}/quotationLines",
        save: "",
        update: "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}/quotationLines/{quotationLineId}",
        "delete": "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}/quotationLines/{quotationLineId}"
      },
      parentId: "categoryId",
      itemId: "quotationLineId"
    },
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
          field: ['categoryId'],
          colspan: 0,
          style: {
            'width': '20%'
          }
        }, {
          field: '',
          colspan: 0,
          style: {
            'width': '20%'
          }
        }, {
          field: ['unitPrice'],
          colspan: 0,
          style: {
            'width': '20%'
          }
        }, {
          field: '',
          colspan: 0,
          style: {
            'width': '20%'
          }
        }, {
          field: ['quantity'],
          colspan: 0,
          style: {
            'width': '10%',
            'text-align': 'right'
          }
        }, {
          field: ['quantity'],
          colspan: 0,
          style: {
            'width': '10%',
            'text-align': 'right'
          }
        }
      ]
    }
  };
  $scope.categoriesGridOptions = {
    hierarchy: true,
    dataSource: {
      type: "odata",
      transport: {
        get: "",
        query: "../../api/tenants/quotations/{quotationId}",
        save: "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}/quotationLines",
        update: "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}",
        "delete": "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}"
      },
      arrayListParam: '',
      itemId: "categoryId"
    },
    columns: {
      titles: [
        {
          title: 'Reference',
          colspan: 0,
          style: {
            'width': '20%'
          }
        }, {
          title: 'Designations',
          colspan: 0,
          style: {
            'width': '20%'
          }
        }, {
          title: 'Prix public',
          colspan: 0,
          style: {
            'width': '20%'
          }
        }, {
          title: 'PU Net',
          colspan: 0,
          style: {
            'width': '20%'
          }
        }, {
          title: 'Qte',
          colspan: 0,
          style: {
            'width': '10%'
          }
        }, {
          title: 'Total Net',
          colspan: 0,
          style: {
            'width': '10%'
          }
        }
      ],
      fields: [
        {
          field: 'name',
          colspan: 6
        }
      ]
    }
  };

}

