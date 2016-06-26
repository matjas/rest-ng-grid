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

  // this is the creation of a new resource
  $httpBackend.whenPOST('/groups').respond(function(method, url, data) {
    var params = angular.fromJson(data);

    var group = DataModel.addGroupHttp(params);

    // get the id of the new resource to populate the Location field
    var groupId = group.groupId;

    return [201, group, { Location: '/groups/' + groupId }];
  });

  $httpBackend.whenPUT(/\/groups\/\d+$/).respond(function(method, url, data) {
    var params = angular.fromJson(data);

    // parse the matching URL to pull out the id (/groups/:id)
    var groupId = url.split('/')[2];
    var group = DataModel.updateGroup(params);
    return [201, group, { Location: '/groups/' + groupId }];
  });


  $httpBackend.whenDELETE(/\/groups\/\d+$/).respond(function(method, url, data) {
    // parse the matching URL to pull out the id (/groups/:id)
    var groupId = url.split('/')[2];

    DataModel.deleteGroup(groupId);

    return [204, {}, {}];
  });

  //PRODUCTS
  $httpBackend.whenGET(/\/groups\/\d+\/products$/).respond(function(method, url, data) {
    // parse the matching URL to pull out the id (/groups/:id/products)
    var groupId = url.split('/')[2];

    var products = DataModel.findAllProducts(groupId);

    return [200, products, {}];
  });

  $httpBackend.whenPOST(/\/groups\/\d+\/products$/).respond(function(method, url, data) {
    var params = angular.fromJson(data);

    var groupId = url.split('/')[2];
    var product = DataModel.addProductHttp(groupId, params);

    return [201, product, { Location: '/groups/' + groupId + '/products'}];
  });

  $httpBackend.whenPUT(/\/groups\/\d+\/products\/\d+$/).respond(function(method, url, data) {
    var params = angular.fromJson(data);

    // parse the matching URL to pull out the id (/groups/:id/products/:id)
    var groupId = url.split('/')[2];
    var productId = url.split('/')[4];
    var product = DataModel.updateProduct(params);
    return [201, product, { Location: '/groups/' + groupId + '/products/' + productId}];
  });

  $httpBackend.whenDELETE(/\/groups\/\d+\/products\/\d+$/).respond(function(method, url, data) {
    // parse the matching URL to pull out the id (/groups/:id/products/:id)
    var groupId = url.split('/')[2];
    var productId = url.split('/')[4];

    DataModel.deleteProduct(groupId, productId);

    return [204, {}, {}];
  });



  //$httpBackend.whenGET(/rest-ng-grid/).passThrough();
  $httpBackend.whenGET(/<div/).passThrough();


});
