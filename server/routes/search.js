const express = require('express');
const router = express.Router();
const { loadData } = require('../utils/loadData');

// Helper function to sanitize query values
function sanitize(input) {
    return String(input)
        .replace(/</g, "&lt;") 
        .replace(/>/g, "&gt;")
        .replace(/^['"]|['"]$/g, '') 
        .trim();
}

// Enhanced search endpoint
router.get('/', async (req, res) => {
    try {
        const data = await loadData();

        // Log dataset keys and sample row for Debugging purposes
        const datasetKeys = Object.keys(data[0]);
        console.log("Dataset Keys:", datasetKeys);
        console.log("Sample Row:", data[0]);

        // Log all keys and values in the first sample row for Debugging purposes
        console.log("Sample Row Key-Value Pairs:");
        Object.entries(data[0]).forEach(([key, value]) => {
            console.log(`Key: "${key}", Value: "${value}"`);
        });

        // Extract query parameters
        const queryKeys = Object.keys(req.query);
        if (queryKeys.length === 0) {
            return res.status(400).json({ error: "No search parameters provided." });
        }
        console.log("Query Keys:", queryKeys);

        // Sanitize query values
        const sanitizedQuery = {};
        queryKeys.forEach(key => {
            sanitizedQuery[key] = sanitize(req.query[key]);
        });
        console.log("Sanitized Query:", sanitizedQuery);

        // Normalize field names in the dataset
        const normalizedKeys = datasetKeys.reduce((acc, key) => {
            const cleanKey = key.replace(/^['"]|['"]$/g, '').trim().toLowerCase(); // Remove quotes and trim spaces
            acc[cleanKey] = key; // Map lowercase keys to original dataset keys
            return acc;
        }, {});
        console.log("Normalized Dataset Keys:", normalizedKeys);

        // Check if all query keys map correctly to dataset keys
        queryKeys.forEach(queryKey => {
            const normalizedKey = queryKey.toLowerCase();
            if (!normalizedKeys[normalizedKey]) {
                console.log(`Query Key "${queryKey}" does not match any dataset field. Check normalized keys.`);
            } else {
                console.log(`Query Key "${queryKey}" maps to Dataset Field "${normalizedKeys[normalizedKey]}".`);
            }
        });

        // Filter data
        const results = data.filter(record => {
            return queryKeys.every(queryKey => {
                const actualField = normalizedKeys[queryKey.toLowerCase()];
                if (!actualField) {
                    console.log(`Field '${queryKey}' not found in dataset.`);
                    return false; // Skip this record if the field is missing
                }
                const queryValue = sanitizedQuery[queryKey];
                const recordValue = record[actualField]?.toString().toLowerCase().trim(); // Normalize record value

                console.log(`Comparing -> Field: ${actualField}, Query Value: ${queryValue}, Record Value: ${recordValue}`);
                return recordValue && recordValue.startsWith(queryValue.toLowerCase());
            });
        });

        // Send results or error if no matches found
        if (results.length > 0) {
            console.log(`Matches found: ${results.length}`);
            res.json(results);
        } else {
            console.log("No matching destinations found.");
            res.status(404).json({ error: "No matching destinations found." });
        }
    } catch (error) {
        console.error("Failed to search data:", error);
        res.status(500).json({ error: "Failed to search data" });
    }
});

module.exports = router;
