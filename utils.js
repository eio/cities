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