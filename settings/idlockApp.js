var myApp = angular.module('idlockApp', ["xeditable", "ngMockE2E"]);

myApp.run(function(editableOptions, editableThemes) {
    editableThemes.bs3.inputClass = 'input-sm';
    editableThemes.bs3.buttonsClass = 'btn-sm';
    editableOptions.theme = 'bs3';
});

myApp.controller('myCodes', function($scope, $filter) {
    var temp;
    $scope.triggerSettings = {
        "homey": true,
        "code": true,
        "tag": true,
        "button": false,
        "auto": false
    };
    $scope.codes = [];
    $scope.types = [
        {value: 4, text: 'Tag'},
        {value: 6, text: 'Code'}
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
                console.log('Set new codes:' + newCodes);
                $scope.codes = angular.fromJson(newCodes);
                console.log($scope.codes);
            });
        });
        $scope.homey.get('triggerSettings', function(err, settings) {
            console.log('Trigger settings:', settings);
            if (settings != (null || undefined)) {
                $scope.triggerSettings = settings;
            }
            document.getElementById('triggerHomey').checked = $scope.triggerSettings.homey;
            document.getElementById('triggerCode').checked = $scope.triggerSettings.code;
            document.getElementById('triggerTag').checked = $scope.triggerSettings.tag;
            document.getElementById('triggerButton').checked = $scope.triggerSettings.button;
            document.getElementById('triggerAuto').checked = $scope.triggerSettings.auto;
        });
    }

    $scope.checkNotEmpty = function(data) {
        if (typeof data === 'undefined') {
            return "Invalid field entry";
        }
    };

    $scope.saveTriggerSettings = function() {
        $scope.triggerSettings.homey = document.getElementById('triggerHomey').checked;
        $scope.triggerSettings.code = document.getElementById('triggerCode').checked;
        $scope.triggerSettings.tag = document.getElementById('triggerTag').checked;
        $scope.triggerSettings.button = document.getElementById('triggerButton').checked;
        $scope.triggerSettings.auto = document.getElementById('triggerAuto').checked;

        $scope.homey.set('triggerSettings', $scope.triggerSettings);
    };

    $scope.saveCode = function(data, id) {
        console.log('saveCode');
        angular.extend(data, { id: id });
        console.log(data);
        return true;
    };

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

    $scope.sendToHomey = function(data) {
        console.log("Data:", data);
        temp = angular.toJson($scope.codes);
        console.log("Json data: ", temp);
        console.log("scope: ", $scope);
        console.log("homey: ", $scope.homey);
        $scope.homey.set('codes', temp);
    }

});