/*Author: Jessica Steslow, 6-28-2023*/

//declare map variable globally so all functions have access
var map_mon;
var monDataStats = {};
var monDataCalendar = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"]

//function to instantiate the Leaflet map
function createMapMon(){
    
    //create the map, centered apprx. on the center of my US city data
    map_mon = L.map('mapcard-monthly', {
        center: [38, -97],
        zoom: 4,
        scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map_mon);
    
    //call getData function
    getDataMon(map_mon);
}

function calcStatsMon(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var city of data.features){
        //loop through each 12 month cycle
        for(var i = 0; i <=11; i+=1){
            //get air quality for current month
            var value = city.properties[monDataCalendar[i]+String("_2021")];
            //add value to array
            allValues.push(value);
        }
    }
    monDataStats.minMon = Math.min(...allValues);  //get min, max, mean stats for our array
    monDataStats.maxMon = Math.max(...allValues);
    var sum = allValues.reduce(function(a, b){return a+b;});    //calculate meanValue
    monDataStats.meanMon = sum/allValues.length;
    console.log("Mon stats: ",monDataStats);
}

//calculate the radius of each proportional symbol
function calcPropRadiusMon(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 8;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue / monDataStats.minMon,0.5715) * minRadius
    //var radius = 1.0083 * Math.pow(attValue / 28,0.5715) * minRadius  //Using 28 as rounded min, same scale as Annual data
    return radius;
}

//function to categorize proportional symbol color by AQI value
function groupPropColorMon(attValue) {
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
function pointToLayerMon(feature, latlng, attributes){
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
    options.radius = calcPropRadiusMon(attValue);

    //Give each featur's circle marker a color based on its attribute value
    options.fillColor = groupPropColorMon(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string starting with city...Example 2.1 line 24
    var popupContent = "<p><b>CBSA:</b> " + feature.properties.CBSA + "</p>";

    //add formatted attribute to popup content string
    var month = attribute.split("_")[0];
    popupContent += "<p><b>Median AQI in " + month + " 2021:</b> " + feature.properties[attribute] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
          offset: new L.Point(0,-options.radius)
      });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
}

function createPropSymbolsMon(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayerMon(feature, latlng, attributes);
        }
    }).addTo(map_mon);
}

function getCircleValuesMon(attribute) {
    //start with min at highest possible and max at lowest possible
    var min = Infinity, max = -Infinity;

    map_mon.eachLayer(function (layer) {
        //get the attribute value
        if (layer.feature) {
            var attributeValue = Number(layer.feature.properties[attribute]);

            if (attributeValue < min) {min = attributeValue;}  //test for min
            if (attributeValue > max) {max = attributeValue;}  //test for max
        }
    });

    var mean = (max + min) / 2;  //set mean

    return {          //return as an object Mon specific
        maxMon: max,
        meanMon: mean,
        minMon: min,
    };
}

function updateLegendMon(attribute) {
    //create content for legend
    var month = attribute.split("_")[0];
    //replace legent content
    //note on weird formatting: month is the unit for changing timestamps, -mon suffix for dataset reference
    //I'm using -mon here for consistency with this JS and the related -ann data and JS
    document.querySelector("span.month-mon").innerHTML = month;  

    //get the max, mean, and min value as an object
    var circleValues = getCircleValuesMon(attribute);

    for (var key in circleValues) {
        //get the radius and fill
        var radius = calcPropRadiusMon(circleValues[key]);
        var fill = groupPropColorMon(circleValues[key]);

        document.querySelector("#" + key).setAttribute("cy", 59 - radius);
        document.querySelector("#" + key).setAttribute("r", radius)
        document.querySelector("#" + key).setAttribute("fill", fill)

        document.querySelector("#" + key + "-text-mon").textContent = Math.round(circleValues[key] * 100) / 100 + " " + key.slice(0,-3);
    }
}

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
           var popupContent = "<p><b>CBSA:</b> " + props.CBSA + "</p>";

           //add formatted attribute to panel content string
           var month = attribute.split("_")[0];
           popupContent += "<p><b>Median AQI in " + month + " 2021:</b> " + props[attribute] + "</p>";

           //update popup with new content
           popup = layer.getPopup();
           popup.setContent(popupContent).update();
        };
    });

    updateLegendMon(attribute);
}

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
}


//Create new sequence controls
function createSequenceControlsMon(attributes){   
    
    var SequenceControl = L.Control.extend({
        options: {position: 'bottomleft',},

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
}

function createLegendMon(attributes) {
    var LegendControl = L.Control.extend({
        options: {position: 'bottomright',},

        onAdd: function () {
            //create the control container with a particular class name
            var container = L.DomUtil.create("div", "legend-control-container-mon");

            container.innerHTML = '<p class="temporalLegend-mon">Stats of <br>Median AQI in <span class="month-mon">Jan</span></p>'

            //Step 1. start attribute legend svg string
            var svg = '<svg id="attribute-legend-mon" width="160px" height="60px">';

            //array of circle names to base loop on        
            var circles = ["maxMon", "meanMon", "minMon"];

            //Step 2: loop to add each circle and text to svg string
            for (var i = 0; i < circles.length; i++) {
                //calculate r and cy and fill color
                var radius = calcPropRadiusMon(monDataStats[circles[i]]);
                var cy = 59 - radius;
                var fill = groupPropColorMon(monDataStats[circles[i]]);

                //circle string
                svg += '<circle class="legend-circle-mon" id="' + circles[i] + '" r="' + radius + '"cy="' +
                    cy + '" fill="' + fill + '"fill-opacity="0.9" stroke="#000000" cx="45"/>';

                //evenly space out labels
                var textY = i * 20 + 20;

                //text string
                svg += '<text id="' + circles[i] + '-text-mon" x="85" y="' + textY + '">' +
                    Math.round(monDataStats[circles[i]] * 100) / 100 + " " + circles[i].slice(0,-3) + "</text>";
            }

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend', svg);

            return container;
        },
    });

    map_mon.addControl(new LegendControl());
    updateLegendMon(attributes[0]); //change the legend-as-created from DataStats values to max-mean-min of first city
}

function getDataMon(map_mon){
    //load the data
    fetch("data/AQI_2021monthly.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processDataMon(json);
            calcStatsMon(json);
            //call function to create proportional symbols
            createPropSymbolsMon(json, attributes);
            createSequenceControlsMon(attributes);
            createLegendMon(attributes);
        })
}

document.addEventListener('DOMContentLoaded',createMapMon);