import matplotlib.pyplot as plt
import json

def plot(lats, lons, title):
    img = plt.imread('world.png')
    plt.imshow(img, zorder=0, extent=[-180, 180, -90, 90])

    plt.plot(lons, lats, 'r^', zorder=1)
    plt.xlabel('lon')
    plt.ylabel('lat')
    plt.title('%s locations' % title)
    plt.show()

#filename = 'pokestops.json'
filename = '../json/pokestops.json'
plotname = 'Pokestop'

def extract_latlon(coordiantes):
    lats = [c['latitude'] for c in coordiantes]
    lons = [c['longitude'] for c in coordiantes]
    return lats, lons

with open(filename) as api_data:
    coordiantes = json.load(api_data)
    lats, lons = extract_latlon(coordiantes)
    #plot(lats, lons, 'Pokestop')
    plot(lats, lons, plotname)

