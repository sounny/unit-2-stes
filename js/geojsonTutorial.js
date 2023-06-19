/*This file was created by following the Leaflet Tutorial "Using GeoJSON with Leaflet"*/
/* https://leafletjs.com/examples/geojson/ */
/*Author: Jessica Steslow, 6-17-2023*/

//Establishing map and popup variables (from quickstart example)
var map = L.map('map').setView([40, -100], 4);   //creating the map and setting the view

var popup = L.popup();    //creates the popup object
function onMapClick(e) {    //defines a function to use the popup object
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}
map.on('click', onMapClick);    //applies the onMapClick function with a click event


//Adding a tilelayer from http://leaflet-extras.github.io/leaflet-providers/preview/ for fun
L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {    //Creates a tileLayer object
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
}).addTo(map);

//Code from the GeoJSON tutorial
var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
};

//Creates the geoJSON object with information from previously defined geojsonFeature
L.geoJSON(geojsonFeature).addTo(map);

//Creating information to add into a geoJSON later
var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

//Creating a style to add to a geoJSON later
var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
};

//Creating the geoJSON object using variables to hold the data and style
L.geoJSON(myLines, {
    style: myStyle
}).addTo(map);

//Creating a variable with feature data in arrays. Given properties to search between the 2 sets
var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

//Creating the geoJSON object with the variable states and defining the style within the geoJSON method
//Applying style for the 2 sets of data in the states variable
L.geoJSON(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"};
            case 'Democrat':   return {color: "#0000ff"};
        }
    }
}).addTo(map);

//Creating a variable with marker options
var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

//Creating a geoJSON object with undefined data, with pointToLayer calling a Marker object
//The Marker is styled using previously defined geojsonMarkerOptions
L.geoJSON(someGeojsonFeature, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    }
}).addTo(map);

//A function to apply popupContent to each feature by checking if the features has properties && popupContent
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
}

var geojsonFeature = {    //defining features with a variable
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
};

L.geoJSON(geojsonFeature, {    //creating the geoJSON object with previously definied feature variable
    onEachFeature: onEachFeature    //calling the onEachFeature function
}).addTo(map);

var someFeatures = [{
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "show_on_map": true
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
}, {
    "type": "Feature",
    "properties": {
        "name": "Busch Field",
        "show_on_map": false
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.98404, 39.74621]
    }
}];

L.geoJSON(someFeatures, {    //creating the geoJSON object with someFeatures definition, using a filter
    filter: function(feature, layer) {
        return feature.properties.show_on_map;
    }
}).addTo(map);