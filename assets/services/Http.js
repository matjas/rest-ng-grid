angular.module('restNgGrid.demo').factory('Http', function($http) {
  var service = {
    query: function() {
      return $http.get('/groups');

    },
    get: function(id) {
      return $http.get('/groups/' + id);
    },
    save: function(data) {
      if(angular.isDefined(data.groupId)) {
        return $http.post('/groups/' + data.groupId, data);
      } else {
        return $http.post('/groups', data);
      }
    },
    delete: function(id) {
      return $http.delete('/groups/' + id);
    }
  };

  return service;
})
