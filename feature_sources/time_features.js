(function (exports) {
    var module = exports.module = {};

    /**
     * Get the feature value for the specified key by using the data of the pokeEntry,
     * which represents the JSON object which is returned from the API for a Pokemon sighting.
     * @param key the name of the feature. The key is read out from the feature_config.json
     * @param pokeEntry the JSON object which is received from the API for a Pokemon sighting
     * @returns the value for the specified feature by considering the given data.
     */
    module.getFeature = function (key, pokeEntry) {
        if (key === "appearedTimeOfDay") {
            return addTimeOfDay(pokeEntry);
        }
        else if (key === "appearedHour") {
            return addHour(pokeEntry);
        }
        else if (key === "appearedMinute") {
            return addMinute(pokeEntry);
        }
        else if (key === "appearedDayOfWeek") {
            return addDayOfWeek(pokeEntry);
        }
        else if (key === "appearedDay") {
            return addDay(pokeEntry);
        }
        else if (key === "appearedMonth") {
            return addMonth(pokeEntry);
        }
        else if (key === "appearedYear") {
            return addYear(pokeEntry);
        }
        else {
            console.log("The key " + key + " is not in the raw API data.");
            throw "UnknownFeatureKey";
        }
    };

    function addHour(_pokeEntry) {
        var date = new Date(_pokeEntry.appearedLocalTime);
        return date.getHours();
    };

    function addMinute(_pokeEntry) {
        var date = new Date(_pokeEntry.appearedLocalTime);
        return date.getMinutes();
    };

    function addDay(_pokeEntry) {
            var date = new Date(_pokeEntry.appearedLocalTime);
            return date.getDate();
    };

    function addDayOfWeek(_pokeEntry) {
        var date = new Date(_pokeEntry.appearedLocalTime);
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
    };

    function addMonth(_pokeEntry) {
        var date = new Date(_pokeEntry.appearedLocalTime);
        return date.getMonth();
    };

    function addYear(_pokeEntry) {
        var date = new Date(_pokeEntry.appearedLocalTime);
        return date.getFullYear();
    };

    /**
     * Adds a nominal value for the time of day
     * Requires a local time field
     * @param _pokeEntry JSON entry to evaluate
     * @returns string: time of the day
     */
    function addTimeOfDay(_pokeEntry) {
            var date = new Date(_pokeEntry.appearedLocalTime);
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
    };


})('undefined' !== typeof module ? module.exports : window);


