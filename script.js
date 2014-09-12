// make sure it resizes properly -- throttle debounces the redraw function
d3.select(window).on('resize', throttle);

var zoom = d3.behavior.zoom()
  .scaleExtent([1, 9])
  .on('zoom', move);


var width = document.getElementById('container').offsetWidth;
var height = width / 2;

var world,worldCache,requests,requestsCache,projection,path,svg,g,dataTable;

var graticule = d3.geo.graticule();

var tooltip = d3.select('#container').append('div').attr('class', 'tooltip hidden');

var worldData = d3.json('api/world-topo-min.json');

var requestsData = d3.json('api/world-breakdown-rounded.json');

var fieldKeys = ["id", "time", "client_ip", "hostname", "uri", "query_string", "status", "cache_status", "bytes", "referer", "user_agent", "client_latitude", "client_longitude", "client_city", "client_state", "client_country"];

draw();

function draw() {

  // set up the map projection and background
  setup(width,height);

  // draw the world, from cache if it exists
  worldCache ? drawWorld(null, worldCache) : worldData.get(drawWorld);

  // draw the requests, from cache if it exists
  requestsCache ? drawRequests(null, requestsCache) : requestsData.get(drawRequests);

}

function setup(width,height){

  // set the proper projection for a map
  projection = d3.geo.mercator()
    .translate([(width/2), (height/2)])
    .scale( width / 2 / Math.PI);

  path = d3.geo.path().projection(projection);

  // append the svg to the container element
  svg = d3.select('#container').append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(zoom)
      .append('g');

  // our root element
  g = svg.append('g');

  // append graticule
  svg.append('path')
     .datum(graticule)
     .attr('class', 'graticule')
     .attr('d', path);

}

function drawWorld(error, data) {

  if (!worldCache) {
    worldCache = data;
  }

  // draw the equator
  g.append('path')
   .datum({type: 'LineString', coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
   .attr('class', 'equator')
   .attr('d', path);

  world = topojson.feature(data, data.objects.countries).features;

  var country = g.selectAll('.country').data(world);

  country.enter().insert('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('id', function(d,i) { return d.id; })
    .attr('title', function(d,i) { return d.properties.name; })
    .style('fill', function(d, i) {
      var shade = Math.floor(Math.random() *  (255 - 0)) + 0;

      return "rgba(0,0," + shade + ",0.4)";
    });

}

function drawRequests(error, data) {

  if (!requestsCache) {
    requestsCache = data;
  }

  requests = data.features;

  var request = g.selectAll('.request').data(requests);

  path.pointRadius(function(d) {
    var length = d.properties.ids.toString().split(',').length,
        radius = d3.scale.linear().domain([1,20]);

    return radius(length);
  });

  request.enter().append('path')
      .attr('class', 'request')
      .attr('d', path)
      .attr('fill', function() {
        var shade = Math.floor(Math.random() *  (255 - 150)) + 150;

        return "rgba(0,0," + shade + ",0.8)";
      });

  //offsets for tooltips
  var offsetL = document.getElementById('container').offsetLeft+20;
  var offsetT = document.getElementById('container').offsetTop+10;

  request.on('mousemove', function(d,i) {
    var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } ),
        length = d.properties.ids.toString().split(',').length;

    tooltip.classed('hidden', false)
      .attr('style', 'left:'+(mouse[0]+offsetL)+'px;top:'+(mouse[1]+offsetT)+'px')
      .html(length);

  }).on('mouseout',  function(d,i) {
    tooltip.classed('hidden', true);
  }).on('click', click);

}

function redraw() {
  width = document.getElementById('container').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  draw();
}

function move() {

  var t = d3.event.translate;
  var s = d3.event.scale;
  zscale = s;
  var h = height/4;


  t[0] = Math.min(
    (width/height)  * (s - 1),
    Math.max( width * (1 - s), t[0] )
  );

  t[1] = Math.min(
    h * (s - 1) + h * s,
    Math.max(height  * (1 - s) - h * s, t[1])
  );

  zoom.translate(t);
  g.attr('transform', 'translate(' + t + ')scale(' + s + ')');

  //adjust the country hover stroke width based on zoom level
  d3.selectAll('.country').style('stroke-width', 1.5 / s);

}

// debounce
var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 600);
}

//geo translation on mouse click in map
function click(d) {
  var latlon = projection.invert(d3.mouse(this));

  d3.json('/api/ids')
    .header("Content-Type", "application/x-www-form-urlencoded")
    .post('ids=' + d.properties.ids)
    .on('load', displayData);
}

function displayData(data) {
  var keys = [];

  for (key in data[0]) {
    keys.push(key);
  }

  var table = dataTable || buildTable();

  table.selectAll('*').remove();

  var thead = table.append('thead'),
      tbody = table.append('tbody');

  thead.append('tr').selectAll('th')
    .data(keys)
    .enter().append('th')
    .text(function(k){ return k; });

  tbody.selectAll('tr')
    .data(data).enter().append('tr')
    .selectAll('td')
    .data(function(d){ return d3.values(d); })
    .enter().append('td')
    .text(function(d){ return d; });

  $('#page table').tablesorter();
}

function buildTable() {
  if (!dataTable) {
    dataTable = d3.select('#page').append('table').attr('class', 'tablesorter');
  }

  return dataTable;
}

