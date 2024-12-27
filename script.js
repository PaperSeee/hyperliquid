// script.js

// Simulation d'un système d'authentification
let isAdmin = false; // À remplacer par votre véritable système d'auth

// Fonction pour vérifier si l'utilisateur est admin
function checkAdminStatus() {
    // Ici, vous implémenteriez votre véritable logique d'authentification
    return isAdmin;
}

// Fonction pour mettre à jour l'affichage du modal selon le rôle
function updateModalView() {
    const isUserAdmin = checkAdminStatus();
    const checkboxes = document.querySelectorAll('.checkbox-item input');
    const comments = document.getElementById('comments');
    const saveButton = document.getElementById('saveButton');

    if (isUserAdmin) {
        // Vue Admin
        checkboxes.forEach(checkbox => checkbox.disabled = false);
        comments.readOnly = false;
        saveButton.style.display = 'block';
    } else {
        // Vue Utilisateur
        checkboxes.forEach(checkbox => checkbox.disabled = true);
        comments.readOnly = true;
        saveButton.style.display = 'none';
    }
}

// Fonction pour charger les données
function loadTickerData(ticker) {
    // Simuler le chargement depuis une base de données
    const savedData = JSON.parse(localStorage.getItem('adminTickerData') || '{}')[ticker];
    
    if (savedData) {
        document.getElementById('devReputation').checked = savedData.checkboxes.devReputation;
        document.getElementById('spread').checked = savedData.checkboxes.spread;
        document.getElementById('liquidity').checked = savedData.checkboxes.liquidity;
        document.getElementById('sellPressure').checked = savedData.checkboxes.sellPressure;
        document.getElementById('comments').value = savedData.comments;
    }
}

// Fonction pour sauvegarder les données (admin uniquement)
function saveTickerData() {
    if (!checkAdminStatus()) return;

    const ticker = document.getElementById('modalTitle').textContent;
    const checkboxes = {
        devReputation: document.getElementById('devReputation').checked,
        spread: document.getElementById('spread').checked,
        liquidity: document.getElementById('liquidity').checked,
        sellPressure: document.getElementById('sellPressure').checked
    };
    const comments = document.getElementById('comments').value;

    // Sauvegarder dans localStorage (à remplacer par votre base de données)
    const savedData = JSON.parse(localStorage.getItem('adminTickerData') || '{}');
    savedData[ticker] = {
        checkboxes,
        comments,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('adminTickerData', JSON.stringify(savedData));

    // Feedback visuel
    const button = document.getElementById('saveButton');
    button.textContent = 'Saved!';
    button.style.background = '#4CAF50';
    setTimeout(() => {
        button.textContent = 'Save Changes';
        button.style.background = '#22543D';
        modal.style.display = "none";
    }, 1500);
}

// Gestionnaires d'événements
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('tickerModal');
    const tbody = document.querySelector('tbody');
    const span = document.getElementsByClassName('close')[0];
    const saveButton = document.getElementById('saveButton');

    // Ouvrir le modal
    tbody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            const ticker = row.cells[1].textContent;
            document.getElementById('modalTitle').textContent = ticker;
            loadTickerData(ticker);
            updateModalView();
            modal.style.display = "block";
        }
    });

    // Fermer le modal
    span.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    }

    // Sauvegarder les changements
    saveButton.addEventListener('click', saveTickerData);

    // Bouton temporaire pour switcher entre admin/user (à remplacer par votre système d'auth)
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Admin/User';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '20px';
    toggleButton.style.right = '20px';
    toggleButton.onclick = () => {
        isAdmin = !isAdmin;
        alert(`Mode switched to: ${isAdmin ? 'Admin' : 'User'}`);
    };
    document.body.appendChild(toggleButton);
});