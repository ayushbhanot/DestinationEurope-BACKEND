const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function loadData() {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '../data/europe-destinations.csv'))
      .pipe(csv()) // Parse CSV directly
      .on('data', (data) => {
        data.ID = data.ID || (results.length + 1).toString(); // Assign IDs dynamically
        results.push(data);
      })
      .on('end', () => {
        console.log("Sample Row:", results[0]); // Log a sample row
        resolve(results);
    })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err); // Log the error
        reject(err);
      });
  });
}

module.exports = { loadData };
