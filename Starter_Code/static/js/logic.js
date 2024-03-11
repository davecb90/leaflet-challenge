// create tile layers
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscaleMap = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

// add topo layer
var topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make base maps object
let basemaps = {
    Default: defaultMap,
    GrayScale: grayscaleMap,
    Topography: topoMap
};

//make a map object
var Map1 = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [defaultMap, grayscaleMap, topoMap]
});

// add default map to the map
defaultMap.addTo(Map1);

// getdata for tectonic plates and show on map
let tectonicPlates = new L.layerGroup();

// call api to get info for tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    //console.log(plateData)

    L.geoJson(plateData,{
        // add styling to show lines
        color: "orange",
        weight: 2
    }).addTo(tectonicPlates);
});

// add the plates to the map
tectonicPlates.addTo(Map1);

// variable to hold earthquakes data layer
let earthquakes = new L.layerGroup();

//get data for the earthquakes and populate layergroup
// call geojson API
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        //console.log(earthquakeData)

        // plot circles to represent earthquake magnitudes

        // make a function that chooses the color of the data point
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if(depth >70)
                return "#f25511";
            else if(depth > 50)
                return "#f27a11";
            else if(depth > 30)
                return "#f7cb07";
            else if(depth > 10)
                return "#c5f211";
            else
                return "green";
            
        }

        // make a function to determine radius size
        function radiusSize(mag){
            if (mag ==0)
                return 1; // makes sure that 0 mag will show on map
            else
                return mag * 5; // so that circle is pronounced
        }
        function dataStyle(feature)
        {
            return {
                opacity: .7,
                fillOpacity: .7,
                fillColor: dataColor(feature.geometry.coordinates[2]), // index 2 for depth
                color: "000000", // black outline
                radius: radiusSize(feature.properties.mag), // gets magnitude
                weight: .5,
                stroke: true
            }
        }
        // add GEOJson Data to earthquake layer group
        L.geoJson(earthquakeData, {
            // make each feature a marker that is on the map, each marker is a circle
            pointToLayer: function(features, latLng) {
                return L.circleMarker(latLng);
            },
            // set the style for each marker
            style: dataStyle,
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}<b>`)
                                
            }
        }).addTo(earthquakes);
    }

);

earthquakes.addTo(Map1);

// add the overlay for the tectonic plates
let overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquake Data": earthquakes
};

// add layer control
L.control.layers(basemaps, overlays).addTo(Map1)

// add legend
let legend = L.control({
    position: "bottomright"
});

// add legend properties
legend.onAdd = function(){
    // div for the legend
    let div = L.DomUtil.create("div", "info legend");

    // set up the intervals
    let intervals = [-10, 10, 30 , 50, 70, 90];
    // set the colors for the intervals
    let colors =[
        "green",
        "#c5f211",
        "#f7cb07",
        "#f27a11",
        "#f25511",
        "red"
    ];

    // loop through intervals and colors
    for(var i=0; i < intervals.length; i++)
    {
        div.innerHTML += "<i style = 'background: "
            + colors[i]
            + "'></i> "
            + intervals[i]
            + (intervals[i + 1] ? "&ndash;" + intervals[i + 1] + "km<br>" : "+");

    }
    return div;
};

legend.addTo(Map1);