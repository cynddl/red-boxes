
mapboxgl.accessToken = 'pk.eyJ1IjoiY3luZGRsIiwiYSI6ImNqMmQ0eWh1aTAwMTcyeG11b3lndWVkc3YifQ.049hpbiQsCbEHLmc0e91lw';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/outdoors-v9',
  center: [4.3819917, 50.7694164],
  zoom: 8
});


// createGeoJSONCircle by Brad Dwyer from
// https://stackoverflow.com/questions/37599561/drawing-a-circle-with-the-radius-in-miles-meters-with-mapbox-gl-js
// Licenced under Creative Commons Attribution-Share Alike.
var createGeoJSONCircle = function(center, radiusInKm, points) {
    if(!points) points = 64;

    var coords = {
        latitude: center[1],
        longitude: center[0]
    };

    var km = radiusInKm;

    var ret = [];
    var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
    var distanceY = km/110.574;

    var theta, x, y;
    for(var i=0; i<points; i++) {
        theta = (i/points)*(2*Math.PI);
        x = distanceX*Math.cos(theta);
        y = distanceY*Math.sin(theta);

        ret.push([coords.longitude+x, coords.latitude+y]);
    }
    ret.push(ret[0]);

    return {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ret]
                }
            }]
        }
    };
};

// Next opening
var date_now = moment();
var day_of_week = date_now.isoWeekday();
var tonight = moment().add(1, 'days').hours(0).minutes(0);

function next_passage(m) {
  var next_days = [];

  if (day_of_week == 7) { // Currently Sunday
    var next = moment().add(1, 'days').hour(m["hours_week"]).minutes(m["minutes_week"])
    next_days.push(next);

  } else if (day_of_week == 6) { // Currently Saturday
    var next = moment().add(2, 'days').hour(m["hours_week"]).minutes(m["minutes_week"]);
    next_days.push(next);

    if(m["hours_sat"] != null)
      next_days.push(moment().hour(m["hours_sat"]).minutes(m["minutes_sat"]));

  } else if (day_of_week == 5) { // Currently Friday
    var next = moment().hour(m["hours_week"]).minutes(m["minutes_week"]);
    next_days.push(next);

    if(m["hours_sat"] != null)
      next_days.push(moment().add(1, 'days').hour(m["hours_sat"][1]).minutes(m["minutes_sat"]));

  } else {
    var next = moment().hour(m["hours_week"]).minutes(m["minutes_week"]);
    next_days.push(next);
    var next = moment().add(1, 'days').hour(m["hours_week"][1]).minutes(m["minutes_week"]);
    next_days.push(next);
  }

  var valid_days = next_days.filter((d) => d > date_now);
  var next_day = moment.min(valid_days);

  m["from_now"] = next_day.from(date_now);
  m["open_today"] = next_day < tonight;
  return m
}

function update_data(data) {
  data["features"].map( (p) => next_passage(p["properties"]));
  return data;
}


// Load markers and populate the map
map.on('load', function() {
$.getJSON("assets/markers.geojson", function(data){
  map.addSource("boxes", {
    type: "geojson",
    data: update_data(data),
    cluster: true,
    clusterMaxZoom: 10, // Max zoom to cluster points on
    clusterRadius: 100 // Radius of each cluster when clustering points (defaults to 50)
  });

  // Single point for user location
  map.addSource('single-point', {
    "type": "geojson",
    "data": {
      "type": "FeatureCollection",
      "features": []
    }
  });
  map.addLayer({
    "id": "point",
    "source": "single-point",
    "type": "symbol",
    "layout": {
      "icon-image": "rocket-15",
      "icon-size": 1.5
    },
    "paint": {
      "text-color": "#222222"
    },
  });

  // Circle around the user location
  map.addSource("polygon", createGeoJSONCircle([0, 0], 0));
  map.addLayer({
    "id": "polygon",
    "type": "fill",
    "source": "polygon",
    "layout": {},
    "paint": {
      "fill-color": "#1899da",
      "fill-opacity": 0.3
    }
  });


  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "boxes",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": {
        property: "point_count",
        type: "interval",
        stops: [
          [0, "#51bbd6"],
          [100, "#f1f075"],
          [750, "#f28cb1"],
        ]
      },
      "circle-radius": {
        property: "point_count",
        type: "interval",
        stops: [
          [0, 20],
          [100, 30],
          [750, 40]
        ]
      }
    }
  });

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "boxes",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12
    }
  });

  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "boxes",
    filter: ["!has", "point_count"],

    'paint': {
      'circle-radius': {
        'base': 1.75,
        'stops': [[12, 2], [22, 180*2.5]]
      },
      'circle-color': {
        property: 'open_today',
        type: 'categorical',
        stops: [
          [false, '#cccccc'],
          [true, '#e22f39']
        ]
      },
      'circle-stroke-width': 2,
      'circle-stroke-color': {
          property: 'open_today',
          type: 'categorical',
          stops: [
            [false, '#aaaaaa'],
            [true, '#99151b']
          ]
      },
    }
  });
});
});


// Add navigation and geolocation controls
var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-left');

// Geolocation
var geoLocate = new mapboxgl.GeolocateControl();
map.addControl(geoLocate);
geoLocate.on('geolocate', function(e) {
  var coords = [e.coords.longitude, e.coords.latitude];

  map.getSource('single-point').setData({
      "type": "Point",
      "coordinates": coords
  });

  map.getSource('polygon').setData(createGeoJSONCircle(coords, 1).data);
  map.setZoom(13);
});


// Add popup when clicking on an unclustered point
map.on('mouseenter', 'unclustered-point', function () {
    map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', 'unclustered-point', function () {
    map.getCanvas().style.cursor = '';
});

map.on('click', 'unclustered-point', function (e) {
  var props = e.features[0].properties;

  var html_content = props.address_fr.replace("\n", "<br />") +
                     "<br />Mon-Fri: " +
                     props.hours_week + ":" + props.minutes_week + "<br />Sat: ";

  if (props.hours_sat != "null")
    html_content += props.hours_sat + ":" + props.minutes_sat;
  else
    html_content += "no schedule"

  new mapboxgl.Popup()
    .setLngLat(e.features[0].geometry.coordinates)
    .setHTML(html_content)
    .addTo(map);
});