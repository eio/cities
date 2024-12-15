// Helper function to add comma in numeric strings greater than 999
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to parse CSV files
function parseCSV(csvString, delimiter = ',') {
  const rows = csvString.trim().split('\n');
  const headers = rows[0].split(delimiter);
  return rows.slice(1).map(row => {
    const values = row.split(delimiter);
    return headers.reduce((acc, header, index) => {
      acc[header.trim()] = values[index].trim();
      return acc;
    }, {});
  });
}

// Event handler function to show a tooltip when map node is hovered
function handleTooltip(event, map, tooltip, tooltipElement) {
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
}