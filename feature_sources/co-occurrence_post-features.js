(function (exports) {
    var module = exports.module = {};

    module.addFeatures = function (keys, dataSet) {
        var cellGroups = cellIdGroups(dataSet);

        dataSet.forEach(function (dataRow) {
            var pokeIdSet = pokemonIdsInCellForDate(cellGroups[dataRow.cellId_90m], dateFromDataRow(dataRow), dataRow.pokemonId);

            for (var i=1; i<=151; i += 1) {
                var co_occurrence = pokeIdSet.has(i);

                if (co_occurrence) {
                    pokeIdSet.delete(i);
                }

                dataRow['co-occ90m_Id' + i] = co_occurrence;
            }
        });

        return dataSet;
    };

    function dateFromDataRow(dataRow) {
        return (dataRow.appearedYear * 10000 + dataRow.appearedMonth) * 100 + dataRow.appearedDay;
    }

    function cellIdGroups(dataSet) {
        var cellGroups = {};

        dataSet.forEach(function (dataRow) {
            if (!hasOwnProperty.call(cellGroups, dataRow.cellId_90m)) {
                cellGroups[dataRow.cellId_90m] = [];
            }

            cellGroups[dataRow.cellId_90m].push({
                "pokemonId": dataRow.pokemonId,
                "date": dateFromDataRow(dataRow) //appearedLocalTime
            });
        });

        return cellGroups;
    }

    function pokemonIdsInCellForDate(cellGroup, date, pokemonId) {
        var pokemonIdSet = new Set();
        var targetPokemonSightings = 0;

        cellGroup.forEach(function (entry) {
            if (entry.date === date) {
                pokemonIdSet.add(entry.pokemonId);

                if (entry.pokemonId === pokemonId) {
                    targetPokemonSightings++;
                }
            }
        });

        if (targetPokemonSightings < 2) {
            pokemonIdSet.delete(pokemonId);
        }

        return pokemonIdSet;
    }
})('undefined' !== typeof module ? module.exports : window);