const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database file path
const DB_FILE = path.join(__dirname, 'database.json');

// Load data from file
async function loadData() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty object
        return {};
    }
}

// Save data to file
async function saveData(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Update data endpoint
app.post('/updateData', async (req, res) => {
    try {
        const { ticker, column, newValue } = req.body;
        if (!ticker || !column || !newValue) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const data = await loadData();
        if (!data[ticker]) {
            data[ticker] = {};
        }
        data[ticker][column] = newValue;
        
        await saveData(data);
        res.json({ success: true, message: 'Data updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update data' });
    }
});

// Update social links endpoint
app.post('/updateSocialLinks', async (req, res) => {
    try {
        const { ticker, twitterHandle, telegramDiscord, website } = req.body;
        if (!ticker) {
            return res.status(400).json({ error: 'Missing ticker' });
        }

        const data = await loadData();
        if (!data[ticker]) {
            data[ticker] = {};
        }
        data[ticker].socialLinks = { twitterHandle, telegramDiscord, website };
        
        await saveData(data);
        res.json({ success: true, message: 'Social links updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update social links' });
    }
});

// Get data endpoint
app.get('/getData', async (req, res) => {
    try {
        const data = await loadData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
