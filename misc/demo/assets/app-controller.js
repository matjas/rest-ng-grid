angular.module('restNgGrid.demo').controller('MainCtrl', function($scope, Resource, Http, DataModel) {

  // putting our server data on scope to display it for learning purposes
  $scope.dataModel = DataModel;
  // trigger for loading groups
  $scope.load = {groups: false};

  $scope.sourceParams = {groupId: null};

  //Fill grid
  $scope.getGroups = function(){
    $scope.load.groups = true;
  };

  //Add new group
  $scope.addNewGroup = function(){
    var newItem = $scope.dataModel.addGroup();
    return newItem;
  };

  //Update group
  $scope.updateGroup = function(item){
    var updatedItem = $scope.dataModel.updateOne(item);
    return updatedItem;
  };

  $scope.productsGridOptions = {
    hierarchy: true,
    dataSource: {
      type: "odata",
      transport: {
        get: "",
        query: "/groups/{groupId}/products",
        save: "",
        update: "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}/quotationLines/{quotationLineId}",
        "delete": "../../api/tenants/quotations/{quotationId}/quotationCategories/{categoryId}/quotationLines/{quotationLineId}"
      },
      parentId: "groupId",
      itemId: "productId"
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
        "delete": "/groups/{groupId}"
      },
      //arrayListParam: '',
      itemId: "groupId"
    },
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

});
