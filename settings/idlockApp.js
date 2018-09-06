var myApp = angular.module('idlockApp', ["xeditable", "ngMockE2E"]);

myApp.run(function(editableOptions, editableThemes) {
    editableThemes.bs3.inputClass = 'input-sm';
    editableThemes.bs3.buttonsClass = 'btn-sm';
    editableOptions.theme = 'bs3';
});

myApp.filter('orderObjectBy', function() {
    return function(items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        filtered.sort(function(a, b) {
            return (a[field] > b[field] ? 1 : -1);
        });
        if (reverse) filtered.reverse();
        return filtered;
    };
});


myApp.controller('myCodes', function($scope, $filter) {
    var temp;

    $scope.codes = [];

    $scope.homey;

    $scope.setHomey = function(homey) {
        console.log('setHomey called');
        
        $scope.homey = homey;
        $scope.homey.get('codes', function(err, newCodes) {
            console.log('Codes:', newCodes);
            if (!newCodes) {
                newCodes = [];
            }
            $scope.$apply(function() {
                console.log('Set new keys:' + newCodes);
                $scope.codes = angular.fromJson(newCodes);
                console.log($scope.codes);
            });
        });
    }

    $scope.checkNotEmpty = function(data) {
        if (typeof data === 'undefined') {
            return "Field cannot be empty";
        }
    };

    $scope.saveCode = function(data, id) {
        console.log('saveCode');
        angular.extend(data, { id: id });
        console.log(data);
        return true;
    };

    $scope.sendToHomey = function(data) {
        console.log("Data:", data);
        temp = angular.toJson($scope.codes);
        console.log("Json data: ", temp);
        console.log("scope: ", $scope);
        console.log("homey: ", $scope.homey);
        $scope.homey.set('codes', temp);
    }

    $scope.removeCode = function(index) {
        $scope.codes.splice(index, 1);
        $scope.homey.set('codes', angular.toJson($scope.codes));
    };

    $scope.addCode = function() {
        $scope.inserted = {
            id: $scope.codes.length + 1,
            user: '',
            index: 0,
            type: ''
        };
        $scope.codes.push($scope.inserted);
    };
});