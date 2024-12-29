const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store data in memory (replace with database in production)
let tokensData = {};

// Update data endpoint
app.post('/updateData', (req, res) => {
    const { ticker, column, newValue } = req.body;
    if (!ticker || !column || !newValue) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!tokensData[ticker]) {
        tokensData[ticker] = {};
    }
    tokensData[ticker][column] = newValue;
    
    res.json({ success: true, message: 'Data updated successfully' });
});

// Update social links endpoint
app.post('/updateSocialLinks', (req, res) => {
    const { ticker, twitterHandle, telegramDiscord, website } = req.body;
    if (!ticker) {
        return res.status(400).json({ error: 'Missing ticker' });
    }

    if (!tokensData[ticker]) {
        tokensData[ticker] = {};
    }
    tokensData[ticker].socialLinks = { twitterHandle, telegramDiscord, website };
    
    res.json({ success: true, message: 'Social links updated successfully' });
});

// Get data endpoint
app.get('/getData', (req, res) => {
    res.json(tokensData);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
