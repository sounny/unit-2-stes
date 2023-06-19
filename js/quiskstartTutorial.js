/*This file was created by following the Leaflet Tutorial "Leaflet Quick Start Guide"*/
/* https://leafletjs.com/examples/quick-start/ */
/*Author: Jessica Steslow, 6-17-2023*/

//Creates the map object with L.map using the string 'map' to refer to the div ID in index.html
//SetView creates the default map position latlong and zoom
var map = L.map('map').setView([51.505, -0.09], 13);

//Associates the openstreetmap tile layer with the map ojbect
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//Creates a variable for the marker and defines the marker object with a latlong location
var marker = L.marker([51.5, -0.09]).addTo(map);

//Creates a variable for the circle and defines the circle object with latlong location
//Also creates style information for the circle
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

//Creates a polygon object defined with 3 coordinates
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

//bindPopup as a method creates popups for the parent entities - marker, circle, polygon
//openPopup closes other popups so only one popup is on the screen at a time. For readability.
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

var popup = L.popup()  //Creating a standalone popup as a layer
    .setLatLng([51.513, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

var popup = L.popup();

//Creating a function to get popup information on click
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

map.on('click', onMapClick); //Calling the onMapClick(e) function with clicking on the map, and passing popup information