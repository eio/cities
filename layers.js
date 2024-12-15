// Build the airports map layer
function buildAirportsLayer(map, airports) {
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
}

// Build the cities map layer
function buildCitiesLayer(map, airports, cities) {
  const cityFeatures = [];
  // Iterate through airports
  airports.forEach(airport => {
    const airportLat = airport.latitude;
    const airportLon = airport.longitude;
    // Iterate through cities with population criteria met
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
  // Build the cities map layer
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
  map.getLayers().forEach(layer => {
    if (layer.get('type') === 'cityLayer') {
      map.removeLayer(layer);
    }
  });
  cityLayer.set('type', 'cityLayer');
  map.addLayer(cityLayer);
}