/*Author: Jessica Steslow, 6-27-2023*/

//declare map variable globally so all functions have access
var map_mon;
var minValue;
var calendar = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"]

//function to instantiate the Leaflet map
function createMapMon(){
    
    //create the map, centered apprx. on the center of my US city data
    map_mon = L.map('mapcard-monthly', {
        center: [38, -97],
        zoom: 4
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map_mon);
    
    //call getData function
    getDataMon(map_mon);
};

function calcMinValueMon(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var city of data.features){
        //loop through each 12 month cycle
        for(var i = 0; i <=11; i+=1){
            //get air quality for current month
            var value = city.properties[calendar[i]+String("_2021")];
            //add value to array
            allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)
    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadiusMon(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 6;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715*1.8) * minRadius //1.8 is custom exaggeration
    return radius;
};

//function to categorize proportional symbol color by AQI value
function groupPropColorMon(attValue) {
    var aqiColor = "";
    if ( attValue <= 50) {           //Green, Good
        aqiColor = "#00e400";
    } else if ( attValue < 100) {    //Yellow, Moderate
        aqiColor = "#ffff00";
    } else if ( attValue < 150) {    //Orange, Unhealthy for Sensitive Groups
        aqiColor = "#ff7e00";
    } else if ( attValue < 200) {    //Red, Unhealthy
        aqiColor = "#ff0000";
    } else if ( attValue < 300) {    //Purple, Very Unhealthy
        aqiColor = "#8f3f97";
    } else {                         //Maroon, Hazardous
        aqiColor = "#7e0023";
    };
    return aqiColor;
}

//function to convert markers to circle markers and add popups
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    //create marker options
    var options = {
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadiusMon(attValue);

    //Give each featur's circle marker a color based on its attribute value
    options.fillColor = groupPropColorMon(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string starting with city...Example 2.1 line 24
    var popupContent = "<p><b>Metro:</b> " + feature.properties.CBSA + "</p>";

    //add formatted attribute to popup content string
    var month = attribute.split("_")[0];
    popupContent += "<p><b>Median AQI in " + month + " 2021:</b> " + feature.properties[attribute] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
          offset: new L.Point(0,-options.radius)
      });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

function createPropSymbolsMon(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map_mon);
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbolsMon(attribute){
    map_mon.eachLayer(function(layer){

        if (layer.feature && layer.feature.properties[attribute]){
          //access feature properties
           var props = layer.feature.properties;

           //update each feature's radius based on new attribute values
           var radius = calcPropRadiusMon(props[attribute]);
           layer.setRadius(radius);

           //update each feature's color based on attribute values
           var newColor = groupPropColorMon(props[attribute]);
           layer.setStyle({fillColor: newColor});

           //add city to popup content string
           var popupContent = "<p><b>Metro:</b> " + props.CBSA + "</p>";

           //add formatted attribute to panel content string
           var month = attribute.split("_")[0];
           popupContent += "<p><b>Median AQI in " + month + " 2021:</b> " + props[attribute] + "</p>";

           //update popup with new content
           popup = layer.getPopup();
           popup.setContent(popupContent).update();

        };
    });
};

function processDataMon(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with Air Quality Index values
        if (attribute.indexOf("_2021") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};


//Create new sequence controls
function createSequenceControlsMon(attributes){   
    
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container-mon');

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider-mon" type="range">')

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step-mon" id="reverse" title="Reverse"><img src="img/arrow_left.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step-mon" id="forward" title="Forward"><img src="img/arrow_right.png"></button>'); 

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });
    

    map_mon.addControl(new SequenceControl());

    ///////add listeners after adding the control!///////
    //set slider attributes
    document.querySelector(".range-slider-mon").max = 11;
    document.querySelector(".range-slider-mon").min = 0;
    document.querySelector(".range-slider-mon").value = 0;
    document.querySelector(".range-slider-mon").step = 1;

    var steps = document.querySelectorAll('.step-mon');

    steps.forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider-mon').value;
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 11 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 11 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider-mon').value = index;

            //Step 9: pass new attribute to update symbols
            updatePropSymbolsMon(attributes[index]);
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider-mon').addEventListener('input', function(){
        //Step 6: get the new index value
        var index = this.value;

        //Step 9: pass new attribute to update symbols
        updatePropSymbolsMon(attributes[index]);
    });
};

function getDataMon(map_mon){
    //load the data
    fetch("data/AQI_2021monthly.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processDataMon(json);
            minValue = calcMinValueMon(json);
            //call function to create proportional symbols
            createPropSymbolsMon(json, attributes);
            createSequenceControlsMon(attributes);
        })
};

document.addEventListener('DOMContentLoaded',createMapMon);