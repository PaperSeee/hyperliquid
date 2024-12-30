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
async function loadTickerData(ticker) {
    try {
        // Fetch token data from API
        const response = await fetch('https://backend-hl.vercel.app/api/tokens');
        const data = await response.json();
        const token = data.tokens.find(t => t.name === ticker);

        if (token) {
            // Update checkboxes with token data
            document.getElementById('devReputation').checked = token.devReputation || false;
            document.getElementById('spreadLessThanThree').checked = token.spreadLessThanThree || false;
            document.getElementById('thickObLiquidity').checked = token.thickObLiquidity || false;
            document.getElementById('noSellPressure').checked = token.noSellPressure || false;
            
            // Update other fields...
            document.getElementById('twitterHandle').value = token.twitter || '';
            document.getElementById('telegramDiscord').value = token.discord || '';
            document.getElementById('website').value = token.website || '';
            
            // Mise à jour du champ commentaire avec les données du backend
            const comments = document.getElementById('comments');
            if (comments) {
                comments.value = token.comment || 'No comment available';
            }
        }
    } catch (error) {
        console.error('Error loading token data:', error);
    }
}

// Fonction pour sauvegarder les données (admin uniquement)
function saveTickerData() {
    if (!checkAdminStatus()) return;

    const ticker = document.getElementById('modalTitle').textContent;
    const checkboxes = {
        devReputation: document.getElementById('devReputation').checked,
        spreadLessThanThree: document.getElementById('spreadLessThanThree').checked,
        thickObLiquidity: document.getElementById('thickObLiquidity').checked,
        noSellPressure: document.getElementById('noSellPressure').checked
    };
    const comment = document.getElementById('comments').value;

    // Envoyer les données au backend
    fetch(`https://backend-hl.vercel.app/api/tokens/${ticker}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...checkboxes,
            comment
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        
        // Feedback visuel
        const button = document.getElementById('saveButton');
        button.textContent = 'Saved!';
        button.style.background = '#4CAF50';
        setTimeout(() => {
            button.textContent = 'Save Changes';
            button.style.background = '#22543D';
            document.getElementById('tickerModal').style.display = "none";
        }, 1500);
    })
    .catch(error => {
        console.error('Error saving data:', error);
        alert('Failed to save changes');
    });
}

// Ajoutez ces variables globales au début du fichier
let currentSortColumn = null;
let isAscending = true;

// Gestionnaires d'événements
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Charger les données depuis l'API backend
        const response = await fetch('https://backend-hl.vercel.app/api/tokens');
        const data = await response.json();

        if (!Array.isArray(data.tokens)) {
            throw new TypeError('Expected an array of tokens');
        }

        const tokens = data.tokens;
        
        // Trier les tokens par ordre alphabétique
        tokens.sort((a, b) => a.name.localeCompare(b.name));
        
        const mainTableBody = document.querySelector('#mainTable tbody');
        const unlistedTableBody = document.querySelector('#unlistedTable tbody');
        const unlistedCount = document.getElementById('unlistedCount');
        let unlistedTokens = 0;
        
        mainTableBody.innerHTML = '';
        unlistedTableBody.innerHTML = '';
        
        // Index pour les tokens listés
        let listedIndex = 1;

        tokens.forEach(token => {
            // Si le token n'a pas de launchCircSupply (pas défini ou non initialisé)
            if (!token.launchCircSupply) {
                const unlistedRow = document.createElement('tr');
                unlistedRow.innerHTML = `<td>${token.name}</td>`;
                unlistedTableBody.appendChild(unlistedRow);
                unlistedTokens++;
            } else {
                const listedRow = document.createElement('tr');
                listedRow.innerHTML = `
                    <td>${listedIndex++}</td>
                    <td>${token.name}</td>
                    <td>${token.launchDate || 'N/A'}</td>
                    <td>${token.teamAllocation || 'N/A'}</td>
                    <td>${token.airdrop1 ? `${token.airdrop1.percentage}% ${token.airdrop1.token}` : 'N/A'}</td>
                    <td>${token.airdrop2 ? `${token.airdrop2.percentage}% ${token.airdrop2.token}` : 'N/A'}</td> 
                    <td>${token.devReputation ? 'Yes' : 'No'}</td>
                    <td>${token.auctionPrice ? '$' + token.auctionPrice : 'N/A'}</td>
                    <td>N/A</td>
                    <td>${token.launchMarketCap || 'N/A'}</td>
                    <td>${token.launchCircSupply}</td>
                    <td>@${token.twitter || 'N/A'}</td>
                    <td>${token.discord || 'N/A'}</td>
                    <td>${token.website || 'N/A'}</td>
                `;

                console.log(token.airdrop1);
                mainTableBody.appendChild(listedRow);
            }
        });

        // Mettre à jour le compteur
        unlistedCount.textContent = `(${unlistedTokens})`;

    } catch (error) {
        console.error('Error loading data:', error);
    }

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
        updateEditButtonVisibility();
    };
    document.body.appendChild(toggleButton);

    // Gestion du thème
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Gestionnaire du bouton de thème
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Fonction de recherche
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    const mainTable = document.getElementById('mainTable').getElementsByTagName('tbody')[0];
    const unlistedTable = document.getElementById('unlistedTable').getElementsByTagName('tbody')[0];

    function moveTokenToMainTable(ticker) {
        const rows = unlistedTable.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].getElementsByTagName('td')[0].innerText === ticker) {
                const newRow = mainTable.insertRow();
                // Add cells to the new row as needed
                newRow.innerHTML = `
                    <td>${mainTable.rows.length}</td>
                    <td>${ticker}</td>
                    <td>2024-XX-XX</td>
                    <td>XX%</td>
                    <td>XXX</td>
                    <td>XXX</td>
                    <td>XX%</td>
                    <td>$X.XX</td>
                    <td>$X.XX</td>
                    <td>$XM</td>
                    <td>XM</td>
                    <td>@${ticker.toLowerCase()}</td>
                    <td>discord.gg/${ticker.toLowerCase()}</td>
                    <td>www.${ticker.toLowerCase()}.com</td>
                `;
                unlistedTable.deleteRow(i);
                break;
            }
        }
    }

    // Example usage: moveTokenToMainTable('TCKR3');

    // Add click handlers for all table headers
    const headers = document.querySelectorAll('#mainTable th');
    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => sortTable(index));
    });

    // Update Edit Data button visibility
    updateEditButtonVisibility();

    // Edit Data button click event
    const editButton = document.getElementById('editButton');
    editButton.addEventListener('click', openEditPanel);

    // Cancel button click event
    const cancelButton = document.getElementById('cancelButton');
    cancelButton.addEventListener('click', closeEditPanel);

    // Save button click event
    const saveEditButton = document.getElementById('saveEditButton');
    saveEditButton.addEventListener('click', saveEditedData);

    // Edit Data button functionality
    const editPanel = document.getElementById('editPanel');
    const editTicker = document.getElementById('editTicker');

    // Populate ticker dropdown with existing tickers
    const populateTickerDropdown = () => {
        const tickers = Array.from(document.querySelectorAll('#mainTable tbody tr')).map(row => row.cells[1].textContent);
        editTicker.innerHTML = '<option value="">Select Ticker</option>' + 
            tickers.map(ticker => `<option value="${ticker}">${ticker}</option>`).join('');
    };

    // Initialize edit functionality
    editButton.addEventListener('click', () => {
        populateTickerDropdown();
        openEditPanel();
    });

    cancelButton.addEventListener('click', closeEditPanel);
    saveEditButton.addEventListener('click', saveEditedData);

    // Update initial button visibility
    updateEditButtonVisibility();
});

// Fonction de tri
function sortTable(columnIndex) {
    const table = document.getElementById('mainTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Change sort direction if clicking the same column
    if (currentSortColumn === columnIndex) {
        isAscending = !isAscending;
    } else {
        isAscending = true;
        currentSortColumn = columnIndex;
    }

    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();

        // Convert to numbers if possible
        if (aValue.startsWith('$')) {
            aValue = parseFloat(aValue.replace('$', '').replace(/[MB]/g, '')) || 0;
            bValue = parseFloat(bValue.replace('$', '').replace(/[MB]/g, '')) || 0;
        } else if (!isNaN(aValue)) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        }

        if (aValue < bValue) return isAscending ? -1 : 1;
        if (aValue > bValue) return isAscending ? 1 : -1;
        return 0;
    });

    // Clear and refill tbody
    tbody.innerHTML = '';
    rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1;
        tbody.appendChild(row);
    });
}

function openModal(ticker) {
    const modal = document.getElementById('tickerModal');
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = ticker;
    
    // Trouver la ligne du ticker dans le tableau
    const row = findTickerRow(ticker);
    if (row) {
        document.getElementById('twitterHandle').value = row.cells[11].textContent;
        document.getElementById('telegramDiscord').value = row.cells[12].textContent;
        document.getElementById('website').value = row.cells[13].textContent;
    }
    
    modal.style.display = "block";
}

function saveModalChanges() {
    const ticker = document.getElementById('modalTitle').textContent;
    const row = findTickerRow(ticker);
    if (row) {
        // Sauvegarder les réseaux sociaux
        row.cells[11].textContent = document.getElementById('twitterHandle').value;
        row.cells[12].textContent = document.getElementById('telegramDiscord').value;
        row.cells[13].textContent = document.getElementById('website').value;
        
        // ...existing save logic for other fields...
    }
    closeModal();
}

function findTickerRow(ticker) {
    const table = document.getElementById('mainTable');
    const rows = table.getElementsByTagName('tr');
    for (let row of rows) {
        if (row.cells[1].textContent === ticker) {
            return row;
        }
    }
    return null;
}

function toggleSocialLinks() {
    const content = document.querySelector('.social-links-content');
    const icon = document.querySelector('.toggle-icon');
    
    content.classList.toggle('active');
    icon.classList.toggle('active');
}

// Function to update the visibility of the Edit Data button
function updateEditButtonVisibility() {
    const editButton = document.getElementById('editButton');
    if (checkAdminStatus()) {
        editButton.style.display = 'block';
    } else {
        editButton.style.display = 'none';
    }
}

// Function to open the edit panel
function openEditPanel() {
    const editPanel = document.getElementById('editPanel');
    editPanel.style.display = 'block'; // Make sure panel is visible
    setTimeout(() => { // Add slight delay to ensure display: block is applied
        editPanel.classList.add('active');
    }, 10);
}

// Function to close the edit panel
function closeEditPanel() {
    const editPanel = document.getElementById('editPanel');
    editPanel.classList.remove('active');
    setTimeout(() => { // Hide panel after transition
        editPanel.style.display = 'none';
    }, 300); // Match transition duration
}

// Function to save the edited data
async function saveEditedData() {
    const ticker = document.getElementById('editTicker').value;
    const column = document.getElementById('editColumn').value;
    const newValue = document.getElementById('editValue').value;

    // Validate inputs
    if (!ticker || !column || !newValue) {
        alert('Please fill in all fields.');
        return;
    }

    // Find the token index
    const tokenRow = findTickerRow(ticker);
    if (!tokenRow) {
        alert('Ticker not found.');
        return;
    }
    const tokenIndex = tokenRow.cells[0].textContent;

    // Send request to server to update data
    try {
        const response = await fetch(`https://backend-hl.vercel.app/api/tokens/${tokenIndex}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [column]: newValue })
        });

        if (response.ok) {
            loadData();
            alert('Data updated successfully.');
            closeEditPanel();
        } else {
            alert('Failed to update data.');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        alert('An error occurred while updating data.');
    }
}

// Function to get the column index based on the column name
function getColumnIndex(columnName) {
    const headers = document.querySelectorAll('#mainTable th');
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].textContent === columnName) {
            return i;
        }
    }
    return -1;
}

// Function to load data from the backend
async function loadData() {
    try {
        const response = await fetch('https://backend-hl.vercel.app/api/tokens');
        const data = await response.json();

        if (!Array.isArray(data.tokens)) {
            throw new TypeError('Expected an array of tokens');
        }

        const tokens = data.tokens;
        updateTables(tokens);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Function to update tables with the fetched data
function updateTables(tokens) {
    const mainTableBody = document.querySelector('#mainTable tbody');
    const unlistedTableBody = document.querySelector('#unlistedTable tbody');
    const unlistedCount = document.getElementById('unlistedCount');
    let unlistedTokens = 0;

    mainTableBody.innerHTML = '';
    unlistedTableBody.innerHTML = '';

    tokens.forEach((token, index) => {
        if (!token.launchCircSupply) {
            const unlistedRow = document.createElement('tr');
            unlistedRow.innerHTML = `<td>${token.name}</td>`;
            unlistedTableBody.appendChild(unlistedRow);
            unlistedTokens++;
        } else {
            const listedRow = document.createElement('tr');
            listedRow.innerHTML = `
                <td>${index + 1}</td>
                <td>${token.name}</td>
                <td>${token.launchDate || 'N/A'}</td>
                <td>${token.teamAllocation || 'N/A'}</td>
                <td>${token.airdrop1 ? `${token.airdrop1.percentage}% ${token.airdrop1.token}` : 'N/A'}</td>
                <td>${token.airdrop2 ? `${token.airdrop2.percentage}% ${token.airdrop2.token}` : 'N/A'}</td>
                <td>${token.devReputation ? 'Yes' : 'No'}</td>
                <td>${token.auctionPrice ? '$' + token.auctionPrice : 'N/A'}</td>
                <td>${token.startPx ?  token.startPx + '$'  : 'N/A'}</td>
                <td>${token.launchMarketCap || 'N/A'}</td>
                <td>${token.launchCircSupply}</td>
                <td>@${token.twitter || 'N/A'}</td>
                <td>${token.discord || 'N/A'}</td>
                <td>${token.website || 'N/A'}</td>
            `;
            mainTableBody.appendChild(listedRow);
        }
    });

    unlistedCount.textContent = `(${unlistedTokens})`;
}

// Load data on page load
document.addEventListener('DOMContentLoaded', loadData);