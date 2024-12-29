const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataFilePath = path.join(__dirname, 'data', 'tickerData.json');

// Endpoint to get ticker data
app.get('/getTickerData', (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(JSON.parse(data));
    });
});

// Endpoint to update ticker data
app.post('/updateTickerData', (req, res) => {
    const { ticker, column, newValue } = req.body;

    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).send('Internal Server Error');
        }

        const tickerData = JSON.parse(data);
        if (!tickerData[ticker]) {
            tickerData[ticker] = {};
        }
        tickerData[ticker][column] = newValue;

        fs.writeFile(dataFilePath, JSON.stringify(tickerData, null, 2), (err) => {
            if (err) {
                console.error('Error writing data file:', err);
                return res.status(500).send('Internal Server Error');
            }
            res.send('Data updated successfully');
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
