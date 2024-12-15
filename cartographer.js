// Filter to cities within 1 hour of an airport
// & a population larger than:
const MINIMUM_POPULATION = 200000;
const radiusInKm = 100; // Approx. distance for a 1-hour drive
const radiusInDegrees = radiusInKm / 111; // Convert to degrees
console.log("Displaying all cities with a population over %s that are within a %s radius of an airport.", MINIMUM_POPULATION, radiusInKm)

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

// Load and process airports.csv
fetch('./airports.csv')
  .then(response => response.text())
  .then(airportData => {
    console.log("Loading airport data from `https://openflights.org/data` (downloaded on 15 Dec 2024)")
    const airports = airportData
      .trim()
      .split('\n')
      .map(line => {
        const [id, name, city, country, iata, icao, latitude, longitude, altitude, timezone, dst, tz, type] = line.split(',');
        return {
          id,
          name,
          city,
          country,
          iata,
          icao,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          type,
        };
      })
      .filter(airport => airport.type === '"airport"' && airport.country === '"United States"');
    console.log('Filtered airports:', airports.length);

    const airportFeatures = airports.map(airport => {
      return new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([airport.longitude, airport.latitude])),
        name: airport.name,
        icao: airport.icao,
      });
    });

    const airportLayer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: airportFeatures,
      }),
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 3,
          fill: new ol.style.Fill({ color: 'rgba(0,100,255,0.5)' }),
          stroke: new ol.style.Stroke({ color: 'rgba(255,255,255,0.5)', width: 1 }),
        }),
      }),
    });

    map.addLayer(airportLayer);

    // Load citypops.csv and filter cities near airports
    fetch('./citypops.csv')
      .then(response => response.text())
      .then(cityData => {
        console.log("Loading city population data from `https://public.opendatasoft.com/explore/dataset/geonames-all-cities-with-a-population-1000/table/?disjunctive.cou_name_en&sort=name&q=america&refine.cou_name_en=United+States` (downloaded on 15 Dec 2024)")
        const cities = parseCSV(cityData, ';').filter(city => parseInt(city.Population, 10) > MINIMUM_POPULATION);
        console.log('Filtered cities:', cities.length);

        const cityFeatures = [];

        airports.forEach(airport => {
          const airportLat = airport.latitude;
          const airportLon = airport.longitude;

          cities.forEach(city => {
            const [cityLat, cityLon] = city.Coordinates.split(',').map(coord => parseFloat(coord));
            const distance = Math.sqrt(
              Math.pow(airportLat - cityLat, 2) + Math.pow(airportLon - cityLon, 2)
            );

            if (distance <= radiusInDegrees) {
              cityFeatures.push(
                new ol.Feature({
                  geometry: new ol.geom.Point(ol.proj.fromLonLat([cityLon, cityLat])),
                  name: city.Name,
                  // Add a population data field
                  population: city.Population,
                })
              );
            }
          });
        });

        const cityLayer = new ol.layer.Vector({
          source: new ol.source.Vector({
            features: cityFeatures,
          }),
          style: new ol.style.Style({
            image: new ol.style.Circle({
              radius: 6,
              fill: new ol.style.Fill({ color: 'rgba(200,100,200,0.7)' }),
              stroke: new ol.style.Stroke({ color: 'rgba(255,255,255,0.7)', width: 1 }),
            }),
          }),
        });

        map.addLayer(cityLayer);
      });

    // Hover interaction for the map
    map.on('pointermove', event => {
      const features = map.getFeaturesAtPixel(event.pixel, { hitTolerance: 5 });
      if (features && features.length > 0) {
        const feature = features[0];
        const name = feature.get('name');
        const pop = feature.get('population');
        const icao = feature.get('icao');
        if (name && pop) {
          tooltipElement.innerHTML = '<b>'+name+'</b><br>Pop: '+numberWithCommas(pop);
          tooltipElement.style.display = 'block';
          tooltip.setPosition(event.coordinate);
          tooltipElement.className = 'tooltip city';
        }
        else if (name && icao) {
          tooltipElement.innerHTML = '<i>'+name+' ('+icao+')</i>';
          tooltipElement.style.display = 'block';
          tooltip.setPosition(event.coordinate);
          tooltipElement.className = 'tooltip airport';
        }
      } else {
        tooltipElement.style.display = 'none';
      }
    });
  });
