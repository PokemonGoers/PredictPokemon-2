import matplotlib.pyplot as plt
import json

def filter_poke_data(unfiltered_data):
    # filter incomplete data
    filtered_data = []
    for sight in unfiltered_data:
        if 'location' in sight:
            filtered_data.append(sight)
    return filtered_data


def create_poke_dict(sights):
    # create pokemon dict which contains pokemonId as key and sights as entries
    poke_dict = {}
    for sight in sights:
        pokemonId = sight['pokemonId']
        if pokemonId in poke_dict:
            poke_dict[pokemonId].append(sight)
        else:
            poke_dict[pokemonId] = [sight]
    return poke_dict


def ntimes_sighted_counter(poke_dict, min_sight_count):
    counter = 0
    for value in poke_dict.values():
        if len(value) >= min_sight_count:
            counter += 1
    return counter


def plot_ntimes(poke_dict, ax):
    stepsize = 5
    number_of_times = [n for n in range(5, 200, stepsize)]
    ntimes_counts = [ntimes_sighted_counter(poke_dict, n) / len(poke_dict) for n in number_of_times]

    ax.bar(number_of_times, ntimes_counts)
    ax.set_ylabel('% of Pokemons')
    ax.set_xlabel('n - number of times, step size %d' % stepsize)
    ax.set_title('Witnessed more than n times')

def print_datapoints(poke_dict):
    datapoints = ['%d: %d' % (key, len(poke_dict[key])) for key in sorted(poke_dict.keys())]
    print('\n'.join(datapoints))

def plot_datapoints(poke_dict, ax):
    ids = [key for key in sorted(poke_dict.keys())]
    datapoints = [len(poke_dict[key]) for key in sorted(poke_dict.keys())]
    
    ax.bar(ids, datapoints)
    ax.set_ylabel('Number of sights')
    ax.set_xlabel('Pokemon ID')
    ax.set_title('Number of Pokemon datapoints')


# how many of pokemons in our data set (in %) are witnessed more than 10 times,
# 20 times, 30 times, and so on. We need to take a look at it.
# Best is to visualize this info as a cumulative plot
# (x axis: number of times, y axis is % of the pokemons).

#filename = 'apiData.json'
filename = 'dummy.json'

with open(filename) as api_data:
    sights = json.load(api_data)
    sights = sights if filename == 'dummy.json' else filter_poke_data(sights)
    poke_dict = create_poke_dict(sights)

    ax1 = plt.subplot(2,1,1)
    ax2 = plt.subplot(2,1,2)

    print_datapoints(poke_dict)
    plot_ntimes(poke_dict, ax1)
    plot_datapoints(poke_dict, ax2)
    plt.show()
