/*
 * Fixed-To-Mobile Number Mapper
 * Copyright (c) 2015 Sebastian Schumann
 * This code is released under the MIT License.
 * The license is available in the LICENSE file distributed with the project.
 */

var f2m = angular.module('f2m-app', []);

f2m.controller('bodyController', ['$scope', '$http', function($scope, $http) {
  console.log("bodyController loading...");
  $scope.formData = {};
  $scope.loading = true;

  // when landing on the page, get all users and show them
  $http.get('https://api.number-mapper.com/api/v1/users')
    .success(function(data) {
      console.log("GET success");
      $scope.users = data;
      $scope.loading = false;
      console.log(data);
    })
    .error(function(data) {
      console.log('Error: ' + data);
    });

  // when submitting the add form, send the user to the node API
  $scope.createUser = function() {
    console.log("createUser");
    if(($scope.formData.fixedNr && $scope.formData.mobileNr && $scope.formData.pin) !== undefined) {
      $scope.loading = true;
      $http.post('https://api.number-mapper.com/api/v1/users', $scope.formData)
        .success(function(data) {
          console.log("POST success");
          $scope.loading = false;
          $scope.formData = {}; // clear the form so our user is ready to enter another
          $scope.users = data;
          console.log(data);
          // RELOADING START
          $http.get('https://api.number-mapper.com/api/v1/users')
            .success(function(data) {
              console.log("GET success");
              $scope.users = data;
              $scope.loading = false;
              console.log(data);
            })
            .error(function(data) {
              console.log('Error: ' + data);
            });
          // RELOADING END
        })
        .error(function(data) {
          console.log('Error: ' + data);
        });
    } else {
      console.log("Not all fields filled");
    }
  };

  // delete a user after checking it
  $scope.deleteUser = function(id) {
    console.log("deleteUser(" + id + ")");
    $scope.loading = true;
    $http.delete('https://api.number-mapper.com/api/v1/users/' + id)
      .success(function(data) {
        console.log("DELETE success");
        $scope.loading = false;
        $scope.users = data;
        console.log(data);
        // RELOADING START
        $http.get('https://api.number-mapper.com/api/v1/users')
          .success(function(data) {
            console.log("GET success");
            $scope.users = data;
            $scope.loading = false;
            console.log(data);
          })
          .error(function(data) {
            console.log('Error: ' + data);
          });
        // RELOADING END
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  };
}]);
