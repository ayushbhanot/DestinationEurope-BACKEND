const express = require('express');
const router = express.Router();
const { loadData } = require('../utils/loadData'); 


router.get('/', async (req, res) => {
    try {
        const data = await loadData(); 
        const countries = [...new Set(data.map(d => d.Country))].filter(Boolean); 
        if (countries.length > 0) {
            res.json(countries);
        } else {
            res.status(404).json({ error: "No countries found" });
        }
    } catch (error) {
        console.error('Failed to load countries:', error);
        res.status(500).json({ error: "Failed to load countries" });
    }
});

module.exports = router;
