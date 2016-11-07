(function (exports) {
    var module = exports.module = {};

    /**
     * Get the feature value for the specified key by using the data of the pokeEntry,
     * which represents the JSON object which is returned from the API for a Pokemon sighting.
     * @param keys array of keys which refer to the name of features. The keys are read out from the feature_config.json
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     * @returns the values for the specified features by considering the given data.
     */
    module.getFeatures = function (keys, pokeEntry) {
        var values = {};
        var date = new Date(pokeEntry.appearedLocalTime);

        keys.forEach(function (key) {
            if (key === "appearedTimeOfDay") {
                values[key] = addTimeOfDay(date);
            }
            else if (key === "appearedHour") {
                values[key] = addHour(date);
            }
            else if (key === "appearedMinute") {
                values[key] = addMinute(date);
            }
            else if (key === "appearedDayOfWeek") {
                values[key] = addDayOfWeek(date);
            }
            else if (key === "appearedDay") {
                values[key] = addDay(date);
            }
            else if (key === "appearedMonth") {
                values[key] = addMonth(date);
            }
            else if (key === "appearedYear") {
                values[key] = addYear(date);
            }
            else {
                console.log("The key " + key + " is not in the raw API data.");
                throw "UnknownFeatureKey";
            }
        });

        return values;
    };

    module.getNominalValues = function (key) {
        if (key === 'appearedTimeOfDay') {
            return ['night', 'morning', 'afternoon', 'evening'];
        }
        else if (key === 'appearedDayOfWeek') {
            return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'dummy_day'];
        }
        else {
            console.log("The key " + key + " does not provide nominal values.");
            throw "UnknownNominalKey";
        }
    };

    function addHour(date) {
        return date.getHours();
    }

    function addMinute(date) {
        return date.getMinutes();
    }

    function addDay(date) {
        return date.getDate();
    }

    function addDayOfWeek(date) {
        var day = date.getDate();
        switch (day){
            case 1:
                return 'Monday';
                break;
            case 2:
                return 'Tuesday';
                break;
            case 3:
                return 'Wednesday';
                break;
            case 4:
                return 'Thursday';
                break;
            case 5:
                return 'Friday';
                break;
            case 6:
                return 'Saturday';
                break;
            case 7:
                return 'Sunday';
                break;
            default:
                return 'dummy_day';
        }
    }

    function addMonth(date) {
        return date.getMonth();
    }

    function addYear(date) {
        return date.getFullYear();
    }

    /**
     * Adds a nominal value for the time of day
     * Requires a local time field
     * @param date date object representing the local time when the pokemon was sighted
     * @returns string: time of the day
     */
    function addTimeOfDay(date) {
        var hour = date.getHours();
            if(20<=hour && hour<24){
                return 'night';
            } else if (0<=hour && hour<7){
                return 'night';
            } else if (7<=hour && hour<12){
                return 'morning';
            } else if (12<=hour && hour<16){
                return 'afternoon';
            } else if (16<=hour && hour<20){
                return 'evening';
            }
    }

})('undefined' !== typeof module ? module.exports : window);


