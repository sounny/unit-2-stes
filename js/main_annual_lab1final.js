/*Author: Jessica Steslow, 6-28-2023*/

//declare map variable globally so all functions have access
var map_ann;
var annDataStats = {};

//function to instantiate the Leaflet map
function createMapAnn(){
    
    //create the map, centered apprx. on the center of my US city data
    map_ann = L.map('mapcard-annual', {
        center: [38, -97],
        zoom: 4,
        scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map_ann);
    
    //call getData function
    getDataAnn(map_ann);
}

function calcStatsAnn(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var city of data.features){
        //loop through each year
        for(var year = 2000; year <= 2022; year+=1){
            //get air quality for current year
            var value = city.properties["medAQI-"+ String(year)];
            //add value to array
            allValues.push(value);
        }
    }
    annDataStats.minAnn = Math.min(...allValues);  //get min, max, mean stats for our array
    annDataStats.maxAnn = Math.max(...allValues);
    var sum = allValues.reduce(function(a, b){return a+b;});    //calculate meanValue
    annDataStats.meanAnn = sum/allValues.length;
    console.log("Ann stats: ",annDataStats);
}

//calculate the radius of each proportional symbol
function calcPropRadiusAnn(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 8;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue / annDataStats.minAnn,0.5715) * minRadius
    //var radius = 1.0083 * Math.pow(attValue / 28,0.5715) * minRadius  //Using min from Monthly data for same scale
    return radius;
}

//function to categorize proportional symbol color by AQI value
function groupPropColorAnn(attValue) {
    var aqiColor = "#add836";         //Setting default color (light blue)
    if ( attValue <= 50) {            //Green, Good
        aqiColor = "#00e400";
    } else if ( attValue <= 100) {    //Yellow, Moderate
        aqiColor = "#ffff00";
    } else if ( attValue <= 150) {    //Orange, Unhealthy for Sensitive Groups
        aqiColor = "#ff7e00";
    } else if ( attValue <= 200) {    //Red, Unhealthy
        aqiColor = "#ff0000";
    } else if ( attValue <= 300) {    //Purple, Very Unhealthy
        aqiColor = "#8f3f97";
    } else {                          //Maroon, Hazardous
        aqiColor = "#7e0023";
    }
    return aqiColor;
}

//function to convert markers to circle markers and add popups
function pointToLayerAnn(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    //create marker options
    var options = {
        //fillColor: "#ff7800",  //fillColor is usually in Options, but I made it dynamic
        color: "#000",           //outline color
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadiusAnn(attValue);

    //Give each featur's circle marker a color based on its attribute value
    options.fillColor = groupPropColorAnn(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string starting with city...Example 2.1 line 24
    var popupContent = "<p><b>CBSA:</b> " + feature.properties.CBSA + "</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("-")[1];
    popupContent += "<p><b>Median AQI in " + year + ":</b> " + feature.properties[attribute] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
          offset: new L.Point(0,-options.radius)
      });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
}

function createPropSymbolsAnn(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayerAnn(feature, latlng, attributes);
        }
    }).addTo(map_ann);
}

function getCircleValuesAnn(attribute) {
    //start with min at highest possible and max at lowest possible
    var min = Infinity, max = -Infinity;

    map_ann.eachLayer(function (layer) {
        //get the attribute value
        if (layer.feature) {
            var attributeValue = Number(layer.feature.properties[attribute]);

            if (attributeValue < min) {min = attributeValue;}  //test for min
            if (attributeValue > max) {max = attributeValue;}  //test for max
        }
    });

    var mean = (max + min) / 2;  //set mean

    return {          //return as an object Ann specific
        maxAnn: max,
        meanAnn: mean,
        minAnn: min,
    };
    
    //example return of console.log(maxAnn): <circle id="maxAnn" class="legend-circle-ann" r="16.504966285053317" cy="42.495033714946686" fill="#ff7e00" fill-opacity="0.9" stroke="#000000" cx="30">
}

function updateLegendAnn(attribute) {
    //create content for legend
    var year = attribute.split("-")[1];
    //replace legent content
    document.querySelector("span.year-ann").innerHTML = year;

    //get the max, mean, and min value as an object
    var circleValues = getCircleValuesAnn(attribute);

    for (var key in circleValues) {
        //get the radius and fill
        var radius = calcPropRadiusAnn(circleValues[key]);
        var fill = groupPropColorAnn(circleValues[key]);

        document.querySelector("#" + key).setAttribute("cy", 59 - radius);
        document.querySelector("#" + key).setAttribute("r", radius)
        document.querySelector("#" + key).setAttribute("fill", fill)

        document.querySelector("#" + key + "-text-ann").textContent = Math.round(circleValues[key] * 100) / 100 + " " + key.slice(0,-3);
        /* idea for later    document.querySelector(".slider-text").innerHTML = year; */
    }
}

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbolsAnn(attribute){
    map_ann.eachLayer(function(layer){

        if (layer.feature && layer.feature.properties[attribute]){
          //access feature properties
           var props = layer.feature.properties;

           //update each feature's radius based on new attribute values
           var radius = calcPropRadiusAnn(props[attribute]);
           layer.setRadius(radius);

           //update each feature's color based on attribute values
           var newColor = groupPropColorAnn(props[attribute]);
           layer.setStyle({fillColor: newColor});

           //add city to popup content string
           var popupContent = "<p><b>CBSA:</b> " + props.CBSA + "</p>";

           //add formatted attribute to panel content string
           var year = attribute.split("-")[1];
           popupContent += "<p><b>Median AQI over " + year + ":</b> " + props[attribute] + "</p>";

           //update popup with new content
           popup = layer.getPopup();
           popup.setContent(popupContent).update();
        }
    });

    updateLegendAnn(attribute);
}

function processDataAnn(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with Air Quality Index values
        if (attribute.indexOf("AQI") > -1){
            attributes.push(attribute);
        }
    }
    return attributes;
}

//Create new sequence controls
function createSequenceControlsAnn(attributes){   
    
    var SequenceControl = L.Control.extend({
        options: {position: "bottomleft",},

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container-ann');

            /* idea for later
            //placeholder for year near slider. will want to mimic createSequenceControl function to create a separate div above slider
            container.insertAdjacentHTML('beforeend', '<div class="slider-text" style="border: 3px solid red;">2000</p>');
            */

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider-ann" type="range">')

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step-ann" id="reverse" title="Reverse"><img src="img/arrow_left.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step-ann" id="forward" title="Forward"><img src="img/arrow_right.png"></button>'); 

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });
    
    map_ann.addControl(new SequenceControl());

    ///////add listeners after adding the control!///////
    //set slider attributes
    document.querySelector(".range-slider-ann").max = 22;
    document.querySelector(".range-slider-ann").min = 0;
    document.querySelector(".range-slider-ann").value = 0;
    document.querySelector(".range-slider-ann").step = 1;

    var steps = document.querySelectorAll('.step-ann');

    steps.forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider-ann').value;
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 22 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 22 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider-ann').value = index;

            //Step 9: pass new attribute to update symbols
            updatePropSymbolsAnn(attributes[index]);
        })
    })

    //Step 5: input listener for sliderS
    document.querySelector('.range-slider-ann').addEventListener('input', function(){
        //Step 6: get the new index value
        var index = this.value;

        //Step 9: pass new attribute to update symbols
        updatePropSymbolsAnn(attributes[index]);
    });
}

function createLegendAnn(attributes) {
    var LegendControl = L.Control.extend({
        options: {position: "bottomright",},

        onAdd: function () {
            //create the control container with a particular class name
            var container = L.DomUtil.create("div", "legend-control-container-ann");

            container.innerHTML = '<p class="temporalLegend-ann">Stats of <br>Median AQI in <span class="year-ann">2000</span>:</p>'

            //Step 1. start attribute legend svg string
            var svg = '<svg id="attribute-legend-ann" width="160px" height="60px">';

            //array of circle names to base loop on        
            var circles = ["maxAnn", "meanAnn", "minAnn"];

            //Step 2: loop to add each circle and text to svg string
            for (var i = 0; i < circles.length; i++) {
                //calculate r and cy and fill color
                var radius = calcPropRadiusAnn(annDataStats[circles[i]]);
                var cy = 59 - radius;
                var fill = groupPropColorAnn(annDataStats[circles[i]]);

                //circle string
                svg += '<circle class="legend-circle-ann" id="' + circles[i] + '" r="' + radius + '"cy="' +
                    cy + '" fill="' + fill + '"fill-opacity="0.9" stroke="#000000" cx="50"/>';

                //evenly space out labels
                var textY = i * 20 + 20;

                //text string
                svg += '<text id="' + circles[i] + '-text-ann" x="90" y="' + textY + '">' +
                    Math.round(annDataStats[circles[i]] * 100) / 100 + " " + circles[i].slice(0,-3) + "</text>";
            }

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend', svg);

            return container;
        },
    });

    map_ann.addControl(new LegendControl());
    updateLegendAnn(attributes[0]); //change the legend-as-created from DataStats values to max-mean-min of first city
}

function getDataAnn(map_ann){
    //load the data
    fetch("data/AQI_annual.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processDataAnn(json);
            calcStatsAnn(json);
            //call function to create proportional symbols
            createPropSymbolsAnn(json, attributes);
            createSequenceControlsAnn(attributes);
            createLegendAnn(attributes);
        })
}

document.addEventListener('DOMContentLoaded',createMapAnn);

const CBSA = ["New York-Newark-Jersey City, NY-NJ-PA", "Los Angeles-Long Beach-Anaheim, CA", "Chicago-Naperville-Elgin, IL-IN-WI"]
const cityList_ann = document.querySelector(".cityList_ann");

