// script.js

// Simulation d'un système d'authentification
let isAdmin = false; // À remplacer par votre véritable système d'auth

// Remplacez votre fonction checkAdminStatus existante
async function checkAdminStatus() {
    try {
        const response = await fetch('https://backend-finalllll.vercel.app/api/check-auth', {
            credentials: 'include'
        });
        return response.ok;
    } catch {
        return false;
    }
}

// Fonction pour mettre à jour l'affichage du modal selon le rôle
async function updateModalView() {
    const isUserAdmin = await checkAdminStatus();
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
        const response = await fetch('https://backend-finalllll.vercel.app/api/tokens');
        const data = await response.json();
        console.log('Data received from API:', data); // Log the data received from the API
        const token = data.find(t => t.name === ticker);

        if (token) {
            document.getElementById('devReputation').checked = token.devReputation || false;
            document.getElementById('spreadLessThanThree').checked = token.spreadLessThanThree || false;
            document.getElementById('thickObLiquidity').checked = token.thickObLiquidity || false;
            document.getElementById('noSellPressure').checked = token.noSellPressure || false;
            
            document.getElementById('twitterHandle').value = token.twitter || '';
            document.getElementById('telegramDiscord').value = token.discord || token.telegram || '';
            document.getElementById('website').value = token.website || '';
            document.getElementById('comments').value = token.comment || '';
        } else {
            console.warn('Token not found:', ticker); // Log if the token is not found
        }
    } catch (error) {
        console.error('Error loading token data:', error);
    }
}

// Fonction pour sauvegarder les données (admin uniquement)
async function saveTickerData() {
    if (!await checkAdminStatus()) return;

    const ticker = document.getElementById('modalTitle').textContent;
    // Trouver le tokenIndex dans la table
    const row = findTickerRow(ticker);
    if (!row) {
        console.error('Token row not found');
        return;
    }
    const tokenIndex = parseInt(row.cells[0].textContent, 10);
    if (isNaN(tokenIndex)) {
        console.error('Invalid token index');
        return;
    }

    const checkboxes = {
        devReputation: document.getElementById('devReputation').checked,
        spreadLessThanThree: document.getElementById('spreadLessThanThree').checked,
        thickObLiquidity: document.getElementById('thickObLiquidity').checked,
        noSellPressure: document.getElementById('noSellPressure').checked
    };
    const socialLinks = {
        twitter: document.getElementById('twitterHandle').value,
        telegram: document.getElementById('telegramDiscord').value,
        discord: document.getElementById('telegramDiscord').value,
        website: document.getElementById('website').value
    };
    const comment = document.getElementById('comments').value;

    // Utiliser tokenIndex au lieu du ticker
    fetch(`https://backend-finalllll.vercel.app/api/tokens/${tokenIndex}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...checkboxes,
            ...socialLinks,
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
            loadData(); // Recharger les données pour mettre à jour l'affichage
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

// Ajouter cette fonction utilitaire après les variables globales
function formatSocialLinks(twitter, telegram, discord, website) {
    const twitterLink = twitter ? `<a href="https://twitter.com/${twitter}" target="_blank">@${twitter}</a>` : '/';
    const telegramLink = telegram ? `<a href="${telegram}" target="_blank">View</a>` : '/';
    const discordLink = discord ? `<a href="${discord}" target="_blank">View</a>` : '/';
    const websiteLink = website ? `<a href="${website}" target="_blank">View</a>` : '/';

    // Avoid duplicates in Telegram/Discord
    const telegramDiscordLink = telegramLink !== '/' && discordLink !== '/' && telegramLink !== discordLink
        ? `${telegramLink} ${discordLink}`
        : telegramLink !== '/' ? telegramLink : discordLink;

    return { twitterLink, telegramDiscordLink, websiteLink };
}

// Modifier la fonction formatNumber
function formatNumber(number) {
    if (!number) return '';
    // Convertir en nombre et fixer 2 décimales
    const num = parseFloat(number).toFixed(2);
    // Séparer la partie entière et décimale
    const [whole, decimal] = num.toString().split('.');
    // Formater la partie entière avec des espaces tous les 3 chiffres
    const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    // Retourner le nombre formaté avec une virgule pour les décimales
    return `${formatted},${decimal}`;
}

// Ajouter cette fonction pour formater les valeurs de marketcap
function formatMarketCap(value) {
    if (!value) return '/';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `$${formatNumber(num)}`;
}

// Gestionnaires d'événements
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Charger les données depuis l'API backend
        const response = await fetch('https://backend-finalllll.vercel.app/api/tokens');
        const data = await response.json();
        console.log('Data received from API:', data); // Log the data received from the API

        if (!Array.isArray(data)) {
            throw new TypeError('Expected an array of tokens');
        }

        const tokens = data;
        
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
                const socialLinks = formatSocialLinks(token.twitter, token.telegram, token.discord, token.website);
                const listedRow = document.createElement('tr');
                listedRow.innerHTML = `
                    <td>${token.tokenIndex}</td>
                    <td>${token.name}</td>
                    <td>${token.launchDate || 'N/A'}</td>
                    <td>${token.teamAllocation || 'N/A'}</td>
                    <td>${token.airdrop1 ? `${token.airdrop1.percentage}% ${token.airdrop1.token}` : '/'}</td>
                    <td>${token.airdrop2 ? `${token.airdrop2.percentage}% ${token.airdrop2.token}` : '/'}</td> 
                    <td>${token.devReputation ? 'Yes' : 'No'}</td>
                    <td>${token.markPx ? '$' + token.markPx : 'N/A'}</td>
                    <td>${token.startPx ? '$' + token.startPx : 'N/A'}</td>
                    <td>${formatMarketCap(token.launchMarketCap)}</td>
                    <td>${formatNumber(token.launchCircSupply)}</td>
                    <td>${socialLinks.twitterLink}</td>
                    <td>${socialLinks.telegramDiscordLink}</td>
                    <td>${socialLinks.websiteLink}</td>
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
    const mainTableBody = document.querySelector('#mainTable tbody');
    const unlistedTableBody = document.querySelector('#unlistedTable tbody');
    const span = document.getElementsByClassName('close')[0];
    const saveButton = document.getElementById('saveButton');

    // Ouvrir le modal pour les tokens listés
    mainTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            const ticker = row.cells[1].textContent;
            openModalWithData(ticker, true);
        }
    });

    // Ouvrir le modal pour les tokens non listés
    unlistedTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            const ticker = row.cells[0].textContent; // Pour les unlisted tokens, le ticker est dans la première colonne
            openModalWithData(ticker, false);
        }
    });

    // Ajouter cette nouvelle fonction pour gérer l'ouverture du modal
    function openModalWithData(ticker, isListed) {
        document.getElementById('modalTitle').textContent = ticker;
        if (isListed) {
            loadTickerData(ticker);
        } else {
            // Réinitialiser les champs pour un nouveau token non listé
            document.getElementById('devReputation').checked = false;
            document.getElementById('spreadLessThanThree').checked = false;
            document.getElementById('thickObLiquidity').checked = false;
            document.getElementById('noSellPressure').checked = false;
            document.getElementById('twitterHandle').value = '';
            document.getElementById('telegramDiscord').value = '';
            document.getElementById('website').value = '';
            document.getElementById('comments').value = '';
        }
        updateModalView();
        modal.style.display = "block";
    }

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

// Ajouter ceci dans la fonction d'initialisation ou au début du fichier
document.querySelectorAll('#mainTable th').forEach(headerCell => {
    headerCell.addEventListener('click', () => {
        const table = headerCell.closest('table');
        const index = Array.from(headerCell.parentElement.children).indexOf(headerCell);
        const sortState = headerCell.getAttribute('data-sort') || 'default';
        
        // Réinitialiser tous les autres en-têtes
        headerCell.parentElement.querySelectorAll('th').forEach(th => {
            if (th !== headerCell) {
                th.setAttribute('data-sort', 'default');
                th.classList.remove('sort-asc', 'sort-desc');
            }
        });

        // Changer l'état de tri
        let newSortState;
        if (sortState === 'default') {
            newSortState = 'asc';
        } else if (sortState === 'asc') {
            newSortState = 'desc';
        } else {
            newSortState = 'default';
        }
        
        headerCell.setAttribute('data-sort', newSortState);
        headerCell.classList.remove('sort-asc', 'sort-desc');
        if (newSortState !== 'default') {
            headerCell.classList.add(`sort-${newSortState}`);
        }

        // Trier le tableau
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const originalOrder = rows.map((row, idx) => ({ row, index: idx }));

        if (newSortState === 'default') {
            // Restaurer l'ordre original
            rows.sort((a, b) => {
                const indexA = originalOrder.find(item => item.row === a).index;
                const indexB = originalOrder.find(item => item.row === b).index;
                return indexA - indexB;
            });
        } else {
            rows.sort((a, b) => {
                let valueA = a.cells[index].textContent;
                let valueB = b.cells[index].textContent;

                // Conversion pour les nombres et les dates
                if (!isNaN(valueA) && !isNaN(valueB)) {
                    valueA = parseFloat(valueA);
                    valueB = parseFloat(valueB);
                } else if (valueA.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    valueA = new Date(valueA);
                    valueB = new Date(valueB);
                }

                if (newSortState === 'asc') {
                    return valueA > valueB ? 1 : -1;
                } else {
                    return valueA < valueB ? 1 : -1;
                }
            });
        }

        // Réinsérer les lignes triées
        const tbody = table.querySelector('tbody');
        rows.forEach(row => tbody.appendChild(row));
    });
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
    const modal = document.getElementById('tickerModal');
    const ticker = document.getElementById('modalTitle').textContent;
    
    // Trouver le token index dans la ligne du tableau
    const row = findTickerRow(ticker);
    if (!row) {
        console.error('Token row not found');
        return;
    }
    
    const tokenIndex = parseInt(row.cells[0].textContent, 10);
    if (isNaN(tokenIndex)) {
        console.error('Invalid token index');
        return;
    }

    const checkboxes = {
        devReputation: document.getElementById('devReputation').checked,
        spreadLessThanThree: document.getElementById('spreadLessThanThree').checked,
        thickObLiquidity: document.getElementById('thickObLiquidity').checked,
        noSellPressure: document.getElementById('noSellPressure').checked
    };
    const socialLinks = {
        twitter: document.getElementById('twitterHandle').value,
        telegram: document.getElementById('telegramDiscord').value,
        discord: document.getElementById('telegramDiscord').value,
        website: document.getElementById('website').value
    };
    const comment = document.getElementById('comments').value;

    // Envoyer les données au backend en utilisant le tokenIndex
    fetch(`https://backend-finalllll.vercel.app/api/tokens/${tokenIndex}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...checkboxes,
            ...socialLinks,
            comment
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        // Feedback visuel
        const button = document.getElementById('saveButton');
        button.textContent = 'Saved!';
        button.style.background = '#4CAF50';
        setTimeout(() => {
            button.textContent = 'Save Changes';
            button.style.background = '#22543D';
            modal.style.display = "none";
            // Recharger les données pour mettre à jour l'affichage
            loadData();
        }, 1500);
    })
    .catch(error => {
        console.error('Error saving data:', error);
        alert('Failed to save changes');
    });
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
async function updateEditButtonVisibility() {
    const editButton = document.getElementById('editButton');
    if (await checkAdminStatus()) {
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
    const tokenIndex = parseInt(tokenRow.cells[0].textContent, 10);
    if (isNaN(tokenIndex)) {
        alert('Invalid token index');
        return;
    }

    // Map column names to token fields
    const columnMapping = {
        'Team Allocation': 'teamAllocation',
        'Launch Date': 'launchDate',
        'Airdrop 1': 'airdrop1',
        'Airdrop 2': 'airdrop2',
        'Dev Reputation': 'devReputation',
        'Spread Less Than Three': 'spreadLessThanThree',
        'Thick OB Liquidity': 'thickObLiquidity',
        'No Sell Pressure': 'noSellPressure',
        'Twitter': 'twitter',
        'Telegram': 'telegram',
        'Discord': 'discord',
        'Website': 'website',
        'Comment': 'comment'
    };

    const field = columnMapping[column];
    if (!field) {
        alert('Invalid column name.');
        return;
    }

    // Prepare the data to be sent
    const data = {};
    if (['devReputation', 'spreadLessThanThree', 'thickObLiquidity', 'noSellPressure'].includes(field)) {
        data[field] = newValue.toLowerCase() === 'true';
    } else {
        data[field] = newValue;
    }

    // Send request to server to update data
    try {
        const response = await fetch(`https://backend-finalllll.vercel.app/api/tokens/${tokenIndex}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            loadData();
            alert('Data updated successfully.');
            closeEditPanel();
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
        const response = await fetch('https://backend-finalllll.vercel.app/api/tokens');
        const tokens = await response.json();
        
        if (!Array.isArray(tokens)) {
            throw new TypeError('Expected an array of tokens');
        }

        const mainTableBody = document.querySelector('#mainTable tbody');
        const unlistedTableBody = document.querySelector('#unlistedTable tbody');
        let unlistedTokens = 0;

        mainTableBody.innerHTML = '';
        unlistedTableBody.innerHTML = '';

        // Filter out duplicate tickers
        const uniqueTokens = tokens.filter((token, index, self) =>
            index === self.findIndex(t => t.name === token.name)
        );

        uniqueTokens.forEach((token, index) => {
            if (!token.launchCircSupply) {
                const unlistedRow = document.createElement('tr');
                unlistedRow.innerHTML = `<td>${token.name}</td>`;
                unlistedTableBody.appendChild(unlistedRow);
                unlistedTokens++;
            } else {
                const socialLinks = formatSocialLinks(token.twitter, token.telegram, token.discord, token.website);
                const listedRow = document.createElement('tr');
                listedRow.innerHTML = `
                    <td>${token.tokenIndex}</td>
                    <td>${token.name}</td>
                    <td>${token.launchDate || 'N/A'}</td>
                    <td>${token.teamAllocation || 'N/A'}</td>
                    <td>${token.airdrop1 ? `${token.airdrop1.percentage}% ${token.airdrop1.token}` : '/'}</td>
                    <td>${token.airdrop2 ? `${token.airdrop2.percentage}% ${token.airdrop2.token}` : '/'}</td>
                    <td>${token.devReputation ? 'Yes' : 'No'}</td>
                    <td>${token.markPx ? '$' + token.markPx : 'N/A'}</td>
                    <td>${token.startPx ? '$' + token.startPx : 'N/A'}</td>
                    <td>${formatMarketCap(token.launchMarketCap)}</td>
                    <td>${formatNumber(token.launchCircSupply)}</td>
                    <td>${socialLinks.twitterLink}</td>
                    <td>${socialLinks.telegramDiscordLink}</td>
                    <td>${socialLinks.websiteLink}</td>
                `;
                mainTableBody.appendChild(listedRow);
            }
        });

        document.getElementById('unlistedCount').textContent = `(${unlistedTokens})`;
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', loadData);

// Function to handle user login
async function login(username, password) {
    try {
        const response = await fetch('https://backend-finalllll.vercel.app/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        alert(data.message);
        updateModalView();
    } catch (error) {
        console.error('Error during login:', error);
        alert('Login failed');
    }
}

// Function to handle user logout
async function logout() {
    try {
        const response = await fetch('https://backend-finalllll.vercel.app/api/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        const data = await response.json();
        alert(data.message);
        updateModalView();
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Logout failed');
    }
}

// Function to check if the user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('https://backend-finalllll.vercel.app/api/check-auth', {
            credentials: 'include'
        });

        return response.ok;
    } catch {
        return false;
    }
}

// Add event listeners for login and logout buttons
document.getElementById('loginButton').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    login(username, password);
});

document.getElementById('logoutButton').addEventListener('click', logout);