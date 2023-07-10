/*Author: Jessica Steslow, 6-28-2023*/

//declare map variable globally so all functions have access
var map_day;
var dayDataStats = {};

//function to instantiate the Leaflet map
function createMapDay(){
    
    //create the map, centered apprx. on the center of my US city data
    map_day = L.map('mapcard-daily', {
        center: [38, -97],
        zoom: 4,
        scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map_day);
    
    //call getData function
    getDataDay(map_day);
}

function calcStatsDay(data, attributes){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    //console.log(data); returns Object {type: "FeatureCollection", features: (40) [...]}
    //console.log(data.features); returns Array (40) [ {0: Object {type: "Feature", properties: {...}, geometry: {...} }}...]
    for(var city of data.features){  //city as a placeholder value iterating over the items in the feature array
        //Iterate through attributes array, already specific to data we want to map
        for(var column of attributes){
            //get air quality for current day
            var value = city.properties[column];
            //add value to array
            allValues.push(value);
        }
    }

    dayDataStats.minDay = Math.min(...allValues);  //get min, max, mean stats for our array
    dayDataStats.maxDay = Math.max(...allValues);
    var sum = allValues.reduce(function(a, b){return a+b;});    //calculate meanValue
    dayDataStats.meanDay = sum/allValues.length;
    console.log("Day stats: ",dayDataStats);
}

//calculate the radius of each proportional symbol
function calcPropRadiusDay(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 4;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue / dayDataStats.minDay,0.5715) * minRadius
    //var radius = 1.0083 * Math.pow(attValue / 28,0.5715) * minRadius  //Using 28 as rounded min, same scale as Annual data
    return radius;
}

//function to categorize proportional symbol color by AQI value
function groupPropColorDay(attValue) {
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
function pointToLayerDay(feature, latlng, attributes){
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
    options.radius = calcPropRadiusDay(attValue);

    //Give each featur's circle marker a color based on its attribute value
    options.fillColor = groupPropColorDay(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string starting with city...Example 2.1 line 24
    var popupContent = "<p><b>CBSA:</b> " + feature.properties.CBSA + "</p>";

    //add formatted attribute to popup content string
    var calDay = attribute.slice(0,-4)+'21';
    popupContent += "<p><b>Median AQI on " + calDay + ":</b> " + feature.properties[attribute] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
          offset: new L.Point(0,-options.radius)
      });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
}

function createPropSymbolsDay(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayerDay(feature, latlng, attributes);
        }
    }).addTo(map_day);
}

function getCircleValuesDay(attribute) {
    //start with min at highest possible and max at lowest possible
    var min = Infinity, max = -Infinity;

    map_day.eachLayer(function (layer) {
        //get the attribute value
        if (layer.feature) {
            var attributeValue = Number(layer.feature.properties[attribute]);

            if (attributeValue < min) {min = attributeValue;}  //test for min
            if (attributeValue > max) {max = attributeValue;}  //test for max
        }
    });

    var mean = (max + min) / 2;  //set mean

    return {          //return as an object Day specific
        maxDay: max,
        meanDay: mean,
        minDay: min,
    };
}

function updateLegendDay(attribute) {
    //create content for legend
    var calDay = attribute.slice(0,-4) + "21";
    //replace legent content
    //note on weird formatting: calDay is the unit for changing timestamps, -day suffix for dataset reference
    //I'm using -day here for consistency with this JS and the related -ann data and JS
    document.querySelector("span.calDay-day").innerHTML = calDay;  

    //get the max, mean, and min value as an object
    var circleValues = getCircleValuesDay(attribute);

    for (var key in circleValues) {
        //get the radius and fill
        var radius = calcPropRadiusDay(circleValues[key]);
        var fill = groupPropColorDay(circleValues[key]);

        document.querySelector("#" + key).setAttribute("cy", 79 - radius);
        document.querySelector("#" + key).setAttribute("r", radius)
        document.querySelector("#" + key).setAttribute("fill", fill)

        document.querySelector("#" + key + "-text-day").textContent = Math.round(circleValues[key] * 100) / 100 + " " + key.slice(0,-3);
    }
}

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbolsDay(attribute){
    map_day.eachLayer(function(layer){

        if (layer.feature && layer.feature.properties[attribute]){
          //access feature properties
           var props = layer.feature.properties;

           //update each feature's radius based on new attribute values
           var radius = calcPropRadiusDay(props[attribute]);
           layer.setRadius(radius);

           //update each feature's color based on attribute values
           var newColor = groupPropColorDay(props[attribute]);
           layer.setStyle({fillColor: newColor});

           //add city to popup content string
           var popupContent = "<p><b>CBSA:</b> " + props.CBSA + "</p>";

           //add formatted attribute to panel content string
           var calDay = attribute.slice(0,-4)+'21';
           popupContent += "<p><b>Median AQI on " + calDay + ":</b> " + props[attribute] + "</p>";

           //update popup with new content
           popup = layer.getPopup();
           popup.setContent(popupContent).update();
        };
    });

    updateLegendDay(attribute);
}

function processDataDay(data){
    //empty array to hold attributes (i.e. headers in geojson associated with data I want to map)
    var attributes = [];

    //properties of the first feature in the dataset (i.e. all headers in geojson)
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with Air Quality Index values
        if (attribute.indexOf("2021") > -1){
            attributes.push(attribute);
        };
    };
    return attributes;
}


//Create new sequence controls
function createSequenceControlsDay(attributes){   
    
    var SequenceControl = L.Control.extend({
        options: {position: 'bottomleft',},

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container-day');

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider-day" type="range">')

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step-day" id="reverse" title="Reverse"><img src="img/arrow_left.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step-day" id="forward" title="Forward"><img src="img/arrow_right.png"></button>'); 

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });
    
    map_day.addControl(new SequenceControl());

    ///////add listeners after adding the control!///////
    //set slider attributes
    document.querySelector(".range-slider-day").max = 364;
    document.querySelector(".range-slider-day").min = 0;
    document.querySelector(".range-slider-day").value = 0;
    document.querySelector(".range-slider-day").step = 1;

    var steps = document.querySelectorAll('.step-day');

    steps.forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider-day').value;
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 364 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 364 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider-day').value = index;

            //Step 9: pass new attribute to update symbols
            updatePropSymbolsDay(attributes[index]);
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider-day').addEventListener('input', function(){
        //Step 6: get the new index value
        var index = this.value;

        //Step 9: pass new attribute to update symbols
        updatePropSymbolsDay(attributes[index]);
    });
}

function createLegendDay(attributes) {
    var LegendControl = L.Control.extend({
        options: {position: 'bottomright',},

        onAdd: function () {
            //create the control container with a particular class name
            var container = L.DomUtil.create("div", "legend-control-container-day");

            container.innerHTML = '<p class="temporalLegend-day">Stats of <br>Median AQI on <span class="calDay-day">1/1/21</span></p>'

            //Step 1. start attribute legend svg string
            var svg = '<svg id="attribute-legend-day" width="160px" height="80px">';

            //array of circle names to base loop on        
            var circles = ["maxDay", "meanDay", "minDay"];

            //Step 2: loop to add each circle and text to svg string
            for (var i = 0; i < circles.length; i++) {
                //calculate r and cy and fill color
                var radius = calcPropRadiusDay(dayDataStats[circles[i]]);
                var cy = 79 - radius;
                var fill = groupPropColorDay(dayDataStats[circles[i]]);

                //circle string
                svg += '<circle class="legend-circle-day" id="' + circles[i] + '" r="' + radius + '"cy="' +
                    cy + '" fill="' + fill + '"fill-opacity="0.9" stroke="#000000" cx="45"/>';

                //evenly space out labels
                var textY = i * 20 + 35;

                //text string
                svg += '<text id="' + circles[i] + '-text-day" x="85" y="' + textY + '">' +
                    Math.round(dayDataStats[circles[i]] * 100) / 100 + " " + circles[i].slice(0,-3) + "</text>";
            }

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend', svg);

            return container;
        },
    });

    map_day.addControl(new LegendControl());
    updateLegendDay(attributes[0]); //change the legend-as-created from DataStats values to max-mean-min of first city
}

function getDataDay(map_day){
    //load the data
    fetch("data/AQI_2021daily.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processDataDay(json); //attributes is a local variable to getDataDay function
            calcStatsDay(json, attributes);
            //call function to create proportional symbols
            createPropSymbolsDay(json, attributes);
            createSequenceControlsDay(attributes);
            createLegendDay(attributes);
        })
}

document.addEventListener('DOMContentLoaded',createMapDay);
