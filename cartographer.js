// Filter to cities within 1 hour of an airport
// & a population larger than:
let MINIMUM_POPULATION = 200000;
let SLIDER_MIN = 10000;
let SLIDER_MAX = 777000;
let SLIDER_STEP = 10000;

const radiusInKm = 100; // Approx. distance for a 1-hour drive
const radiusInDegrees = radiusInKm / 111; // Convert to degrees
console.log("Displaying all cities with a population over %s that are within a %s radius of an airport.", MINIMUM_POPULATION, radiusInKm);

// Define map and base layer
const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([-111, 45]),
    zoom: 3.3,
  }),
});
// Create the tooltip element
const tooltipElement = document.createElement('div');
tooltipElement.className = 'tooltip';
tooltipElement.style.display = 'none';
document.body.appendChild(tooltipElement);
// Create an OpenLayers overlay for the tooltip
const tooltip = new ol.Overlay({
  element: tooltipElement,
  offset: [10, 0],
  positioning: 'center',
});
map.addOverlay(tooltip);
// Hover interaction for the map
map.on('pointermove', event => {
  handleTooltip(event, map, tooltip, tooltipElement);
});

// Load and process airports.csv
fetch('./airports.csv')
  .then(response => response.text())
  .then(airportData => {
    console.log("Loading airport data from `https://openflights.org/data` (downloaded on 15 Dec 2024)")
    const airports = processAirportData(airportData);
    console.log('Filtered airports:', airports.length);
    buildAirportsLayer(map, airports);

    // Load citypops.csv and filter cities near airports
    fetch('./citypops.csv')
      .then(response => response.text())
      .then(cityData => {
        console.log("Loading city population data from `https://public.opendatasoft.com/explore/dataset/geonames-all-cities-with-a-population-1000/table/?disjunctive.cou_name_en&sort=name&q=america&refine.cou_name_en=United+States` (downloaded on 15 Dec 2024)")
        const cities = parseCSV(cityData, ';').filter(city => parseInt(city.Population, 10) > MINIMUM_POPULATION);
        console.log('Filtered cities:', cities.length);
      });

    // Create the population slider
    const slider = document.getElementById('populationSlider');
    slider.min = SLIDER_MIN;
    slider.max = SLIDER_MAX;
    slider.value = MINIMUM_POPULATION;
    slider.step = SLIDER_STEP;
    document.getElementById('popSliderLabel').innerHTML = numberWithCommas(slider.value);
    slider.addEventListener('input', (event) => {
      MINIMUM_POPULATION = parseInt(event.target.value, 10);
      let pop = numberWithCommas(MINIMUM_POPULATION);
      console.log('Minimum population updated to:', pop);
      document.getElementById('popSliderLabel').innerHTML = pop;
      // Reset the cities layer
      updateCityLayer();
    });
    // Update city layer based on the population slider
    function updateCityLayer() {
      // Reload and filter cities based on the new population
      fetch('./citypops.csv')
        .then(response => response.text())
        .then(cityData => {
          const cities = parseCSV(cityData, ';').filter(city => parseInt(city.Population, 10) > MINIMUM_POPULATION);
          console.log('Filtered cities:', cities.length);
          buildCitiesLayer(map, airports, cities);
        });
    }
    // Initialize the cities layer
    updateCityLayer();
  });
