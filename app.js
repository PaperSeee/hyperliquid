const express = require('express');
const cors = require('cors');
const app = express();

// 1. Corriger la configuration CORS - ajouter le domaine manquant
const corsOptions = {
  origin: [
    'https://backend-finalllll.vercel.app',
    'https://backend-finalsure.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500'  // Pour les tests locaux
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// 3. S'assurer que la route /api/update est bien définie et exposée
app.post('/api/update', async (req, res) => {
  // 4. Ajouter des logs détaillés
  console.log('Début traitement /api/update');
  console.log('Headers de la requête:', req.headers);
  console.log('Body de la requête:', req.body);
  
  try {
    // Logique de mise à jour des données
    // [Votre logique existante...]
    
    // Simulation d'une opération de mise à jour
    console.log('Démarrage de la mise à jour des données...');
    
    // Attendez que votre opération soit terminée
    // await yourUpdateOperation();
    
    console.log('Mise à jour des données terminée avec succès');
    res.status(200).json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données:', error);
    res.status(500).json({ success: false, message: 'Error updating data', error: error.message });
  }
});

// 5. Ajouter un redirect si nécessaire
app.get('/update', (req, res) => {
  res.redirect('/api/update');
});

// 2. Corriger les exports multiples - supprimer les exports en double
// Ne garder que celui-ci à la fin du fichier:
module.exports = app;