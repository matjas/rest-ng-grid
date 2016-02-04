angular.module('restNgGrid.demo').service('DataModel',[ '$timeout', '$q', function DataModel($timeout, $q) {

  //options
  this.dataGroups = [
    {
      id: 1,
      name: "RTV"
    },
    {
      id: 2,
      name: "AGD"
    },
    {
      id: 3,
      name: "Computers"
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
        lastId = getLastId(that.dataGroups);
    $timeout(function(){
      var newGroup = {
        id: lastId + 1,
        name: 'NewGroup' + (lastId + 1)
      };
      that.dataGroups.push(newGroup);
      q.resolve(newGroup);
    },500);
    return q.promise
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

  // add a new data item that does not exist already
  // must compute a new unique id and backfill in
  this.addGroupHttp = function(dataItem) {
    // must calculate a unique ID to add the new data
    var newId = this.newId();
    dataItem = dataItem || {name: 'NewGroup', id: null}
    dataItem.id = newId;
    //this.dataGroups.push(dataItem);
    return dataItem;
  };

  // return an id to insert a new data item at
  this.newId = function() {
    var lastId = getLastId(this.getData());
    // increment by one
    return lastId + 1;
  };

  this.updateGroup = function(dataItem) {
    // find the game that matches that id
    var groups = this.getData();
    var match = null;
    dataItem.name = "UpdatedGroup";
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
  this.findAllProducts = function(groupId) {
    return _.filter(this.dataGroupProducts, {groupId: groupId});
  };

  //Helpers
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
