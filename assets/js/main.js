
mapboxgl.accessToken = 'pk.eyJ1IjoiY3luZGRsIiwiYSI6ImNqMmQ0eWh1aTAwMTcyeG11b3lndWVkc3YifQ.049hpbiQsCbEHLmc0e91lw';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/cynddl/cj1rucvvs001q2spojjpy28hb',
  center: [4.3819917, 50.7694164],
  zoom: 8
});


// createGeoJSONCircle by Brad Dwyer from
// https://stackoverflow.com/questions/37599561/drawing-a-circle-with-the-radius-in-miles-meters-with-mapbox-gl-js
// Licenced under Creative Commons Attribution-Share Alike.
var createGeoJSONCircle = function(center, radiusInKm, points) {
  if(!points) points = 64;

  var coords = { latitude: center[1], longitude: center[0] };
  var km = radiusInKm;

  var ret = [];
  var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
  var distanceY = km/110.574;

  var theta, x, y;
  for(var i=0; i<points; i++) {
    theta = (i/points)*(2*Math.PI);
    x = distanceX*Math.cos(theta);
    y = distanceY*Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
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
var date_now = new Date();
var current_day_of_week = date_now.getDay();
if ((current_day_of_week == 0) || (current_day_of_week == 6 ))
  var filter_tag = "ts_sat";
else
  var filter_tag = "ts_week";

var filter_ts = date_now.getHours() * 60 + date_now.getMinutes();

// Load markers and populate the map
map.on('load', function() {
  map.addSource("redboxes_markers", {
    type: "vector",
    url: "mapbox://cynddl.cj34lt91q000t2qo776tmpysf-7ybmq"
  });

  map.addLayer({
    "id": "redboxes_markers",
    "type": "circle",
    "source": "redboxes_markers",
    "source-layer": "redboxes_ts",
    "minzoom": 11,
    'paint': {
      'circle-radius': {
        'base': 1.5,
        'stops': [[12, 2], [22, 180*2.5]]
      },
      'circle-color': {
        property: filter_tag,
        type: 'interval',
        stops: [
          [0, '#cccccc'],
          [filter_ts, '#e22f39']
        ]
      },
      'circle-stroke-width': 2,
      'circle-stroke-color': {
        property: filter_tag,
        type: 'interval',
        stops: [
          [0, '#aaaaaa'],
          [filter_ts, '#99151b']
        ]
      }
    }
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

  // Add navigation and geolocation controls
  var nav = new mapboxgl.NavigationControl();
  map.addControl(nav, 'top-left');

  // Geolocation
  window.geoLocate = new mapboxgl.GeolocateControl();
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
  map.on('mouseenter', 'redboxes_markers', function () {
      map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'redboxes_markers', function () {
      map.getCanvas().style.cursor = '';
  });

  map.on('click', 'redboxes_markers', function (e) {
    var props = e.features[0].properties;
    var human_week = new Date(props.ts_week * 6e4).toISOString().slice(-13, -8);
    var html_content = props.address_fr.replace("\n", "<br />") +
      "<br />Mon-Fri: " + human_week + "<br />Sat: ";

    if ("hours_sat" in props) {
      var human_sat = new Date(props.ts_sat * 6e4).toISOString().slice(-13, -8);
      html_content += human_sat;
    }
    else
      html_content += "no schedule";

    new mapboxgl.Popup()
      .setLngLat(e.features[0].geometry.coordinates)
      .setHTML(html_content)
      .addTo(map);
  });

  // remove spinner and show find button when all content loaded
  map.on('data', function() {
      document.getElementById("spinner").style.display = "none";
      document.getElementById("start-find").style.display = "inherit";
  })
});
