const express = require('express');
const router = express.Router();
const { loadData } = require('../utils/loadData');
const Destination = require('../models/Destination');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Helper function to sanitize user input (for values only)
function sanitize(input) {
    return String(input).replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

// Route to search for a destination by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await loadData(); 
        const destination = data.find((item) => item.ID === id);

        if (destination) {
            res.status(200).json(destination);
        } else {
            res.status(404).json({ error: 'Destination not found' });
        }
    } catch (error) {
        console.error('Error fetching destination by ID:', error);
        res.status(500).json({ error: 'Failed to fetch destination by ID' });
    }
});


router.get('/:id/coordinates', async (req, res) => {
    const id = req.params.id.trim();
    try {
        const data = await loadData();
        const destination = data.find(d => d.ID === id);
        if (destination) {
            res.json({ latitude: destination.Latitude, longitude: destination.Longitude });
        } else {
            res.status(404).json({ error: "Destination not found" });
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        res.status(500).json({ error: "Failed to load data" });
    }
});


// Enhanced search endpoint
router.get('/', async (req, res) => {
    try {
        const data = await loadData(); // Load the data
        console.log("Dataset Keys:", Object.keys(data[0])); // Log the keys from the dataset

        const queryKeys = Object.keys(req.query);

        if (queryKeys.length === 0) {
            return res.status(400).json({ error: "No search parameters provided." });
        }

        // Sanitize query values (but NOT keys)
        const sanitizedQuery = {};
        queryKeys.forEach(key => {
            sanitizedQuery[key] = sanitize(req.query[key]).toLowerCase();
        });

        console.log("Sanitized Query:", sanitizedQuery); // Log sanitized query

        // Filter data based on the sanitized query
        const results = data.filter(record => {
            return queryKeys.every(queryKey => {
                const recordValue = record[queryKey]; // Match exact key from query
                console.log(`Key: ${queryKey}, Query Value: ${sanitizedQuery[queryKey]}, Record Value: ${recordValue}`);
                
                if (!recordValue) {
                    console.log(`Skipping record: Key '${queryKey}' not found in record.`);
                    return false;
                }

                return recordValue.toLowerCase().includes(sanitizedQuery[queryKey]);
            });
        });

        results.length > 0
            ? res.json(results)
            : res.status(404).json({ error: "No matching destinations found." });
    } catch (error) {
        console.error('Failed to search data:', error);
        res.status(500).json({ error: "Failed to search data", details: error.message });
    }
});

router.get('/:destinationId/reviews', async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.destinationId);
        if (!destination) {
            return res.status(404).json({ error: 'Destination not found' });
        }
        res.json(destination.reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});


router.post('/:destinationId/reviews', authMiddleware, async (req, res) => {
    const { rating, comment } = req.body;
    const { destinationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(destinationId)) {
        return res.status(400).json({ error: 'Invalid destination ID format' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
        const destination = await Destination.findById(destinationId);
        if (!destination) {
            return res.status(404).json({ error: 'Destination not found' });
        }

        const user = req.user;
        const review = {
            user: user.id,
            nickname: user.nickname || 'Anonymous',
            rating,
            comment,
            date: Date.now(),
        };

        destination.reviews.push(review);
        destination.averageRating =
            destination.reviews.reduce((sum, review) => sum + review.rating, 0) / destination.reviews.length;

        await destination.save();
        res.json(destination);
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ error: 'Failed to add review' });
    }
});



module.exports = router;
