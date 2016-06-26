angular.module('restNgGrid.demo').factory('Resource', function($resource) {
  return $resource('/groups/:groupId', {groupId: '@groupId'});
});
