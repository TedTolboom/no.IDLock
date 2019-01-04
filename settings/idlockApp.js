var myApp = angular.module('idlockApp', ["xeditable", "ngMockE2E"]);

myApp.run(function(editableOptions, editableThemes) {
    editableThemes.bs3.inputClass = 'input-sm';
    editableThemes.bs3.buttonsClass = 'btn-sm';
    editableOptions.theme = 'bs3';
});

myApp.controller('myCodes', function($scope, $filter) {
    var temp;

    $scope.codes = [];
    $scope.types = [
        {value: 4, text: 'Tag'},
        {value: 6, text: 'Key'}
    ]; 
    
    $scope.showType = function(filterValue) {
        var selected = $filter('filter')($scope.types, {value: filterValue});
        return (filterValue && selected.length) ? selected[0].text : 'Not set';
    };
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
            return "Invalid field entry";
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
            user: 'User',
            index: '1',
            type: 6
        };
        $scope.codes.push($scope.inserted);
    };
});