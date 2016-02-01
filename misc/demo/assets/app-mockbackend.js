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

  $httpBackend.whenGET(/\/groups\/\d+\/products/).respond(function(method, url, data) {
    // parse the matching URL to pull out the id (/groups/:id/products)
    var groupId = url.split('/')[2];

    var products = DataModel.findAllProducts(groupId);

    return [200, products, {}];
  });

  // this is the creation of a new resource
  $httpBackend.whenPOST('/groups').respond(function(method, url, data) {
    var params = angular.fromJson(data);

    var group = DataModel.addOne(params);

    // get the id of the new resource to populate the Location field
    var groupId = group.groupId;

    return [201, group, { Location: '/groups/' + groupId }];
  });

  // this is the update of an existing resource (ngResource does not send PUT for update)
  $httpBackend.whenPOST(/\/groups\/\d+/).respond(function(method, url, data) {
    var params = angular.fromJson(data);

    // parse the matching URL to pull out the id (/groups/:id)
    var groupId = url.split('/')[2];

    var group = DataModel.updateGroup(groupId, params);

    return [201, group, { Location: '/groups/' + groupId }];
  });

  $httpBackend.whenPUT(/\/groups\/\d+/).respond(function(method, url, data) {
    var params = angular.fromJson(data);

    // parse the matching URL to pull out the id (/groups/:id)
    var groupId = url.split('/')[2];
    var group = DataModel.updateGroup(params);
    return [201, group, { Location: '/groups/' + groupId }];
  });

  //// this is the update of an existing resource (ngResource does not send PUT for update)
  //$httpBackend.whenDELETE(/\/games\/\d+/).respond(function(method, url, data) {
  //  // parse the matching URL to pull out the id (/games/:id)
  //  var gameid = url.split('/')[2];
  //
  //  ServerDataModel.deleteOne(gameid);
  //
  //  return [204, {}, {}];
  //});

  //$httpBackend.whenGET(/rest-ng-grid/).passThrough();

});
