const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = 'https://backend-finalsure.vercel.app';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Logger pour les requêtes API
function logApiRequest(method, endpoint, status, responseData) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${endpoint} - Status: ${status}`);
    if (status !== 200) {
        console.error('Response error:', responseData);
    }
}

// Helper pour faire des requêtes HTTP
function makeRequest(url, method, data, token) {
    return new Promise((resolve, reject) => {
        const options = new URL(url);
        const protocol = options.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            method: method || 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (token) {
            requestOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const req = protocol.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    logApiRequest(method, url, res.statusCode, parsedData);
                    resolve({
                        status: res.statusCode,
                        data: parsedData
                    });
                } catch (e) {
                    logApiRequest(method, url, res.statusCode, responseData);
                    reject(new Error(`Erreur de parsing JSON: ${e.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            console.error(`Erreur de requête: ${error.message}`);
            reject(error);
        });
        
        if (data && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Route de diagnostic pour tester l'API
app.get('/api/diagnostic', async (req, res) => {
    try {
        const result = await makeRequest(`${API_BASE_URL}/api/tokens`, 'GET');
        
        // Vérification basique de la santé de l'API
        const healthCheck = {
            apiStatus: result.status === 200 ? 'OK' : 'ERROR',
            timestamp: new Date().toISOString(),
            responseTime: '...',  // Ceci pourrait être implémenté avec un timer
            tokensCount: Array.isArray(result.data) ? result.data.length : 'N/A',
            lastTokenUpdate: Array.isArray(result.data) && result.data.length > 0 ? 
                result.data.reduce((latest, token) => {
                    if (!token.lastUpdated) return latest;
                    return new Date(token.lastUpdated) > new Date(latest) ? token.lastUpdated : latest;
                }, '1970-01-01') : 'N/A'
        };
        
        res.json(healthCheck);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            apiStatus: 'UNREACHABLE'
        });
    }
});

// Proxy pour l'API de tokens
app.get('/api/tokens/proxy', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const result = await makeRequest(`${API_BASE_URL}/api/tokens`, 'GET', null, token);
        res.status(result.status).json(result.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Proxy pour le refresh des tokens
app.post('/api/tokens/refresh/proxy', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const result = await makeRequest(`${API_BASE_URL}/api/tokens/refresh`, 'POST', req.body, token);
        res.status(result.status).json(result.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour obtenir l'état actuel et l'historique des requêtes API
app.get('/api/monitoring', (req, res) => {
    // Cette fonction pourrait être étendue pour stocker un historique des requêtes
    res.json({
        status: 'Service en cours d\'exécution',
        uptime: process.uptime() + ' secondes',
        memory: process.memoryUsage(),
        // Vous pourriez ajouter d'autres métriques ici
    });
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur diagnostic démarré sur http://localhost:${PORT}`);
    console.log(`Ouvrez http://localhost:${PORT}/api/diagnostic pour tester l'API`);
});
