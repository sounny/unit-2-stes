/*Author: Jessica Steslow, 6-19-2023*/

//declare map var in global scope
var map;

//function to instantiate the Leaflet map
function createMap(){
    
    //create the map, centered apprx. on the center of my US city data
    map = L.map('map', {
        center: [38, -97],
        zoom: 5
    });

    /*
    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);
    */
    
    //defining layer information Stamen_TerrainBackground as a variable for later use. No key needed.
    var Stamen_TerrainBackground = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 18,
        ext: 'png'
    });

    //defining layer information for CartoDB_VoyagerOnlyLabels as a variable for later use. No key needed.
    var CartoDB_VoyagerOnlyLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 18
    });

    //Using layerGroup method to treat two layers as one and add to map. I had trouble using addTo twice
    L.layerGroup([Stamen_TerrainBackground, CartoDB_VoyagerOnlyLabels]).addTo(map);
    
    //call getData function
    getData(map);
};

//function to attach popups to each mapped feature
function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    var cbsaFilter = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            //using if-else to skip repetitive properties I don't want to display
            if(property == "Pop Rank" || property == "City" || property == "State") {
                //the if block is blank. I skip copying these to popupContent
            } else {
                popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
            }      
        }
        layer.bindPopup(popupContent);
    };
};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data, then exectue mapCities. response passed by default
    fetch("data/medianAQI.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                onEachFeature: onEachFeature
            }).addTo(map);
        })  
};

document.addEventListener('DOMContentLoaded',createMap)