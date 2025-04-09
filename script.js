// Basic utility and formatting functions

// Authentication utility - adds auth token to requests when available
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(url, mergedOptions);
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Check if current user is admin
function isAdmin() {
    return localStorage.getItem('authToken') !== null;
}

// Format functions for display
function formatNumber(number) {
    if (!number) return '';
    const num = parseFloat(number).toFixed(2);
    const [whole, decimal] = num.toString().split('.');
    const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted},${decimal}`;
}

function formatMarketCap(value) {
    if (!value) return '/';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${formatNumber(num)}$`;
}

// Améliorer formatDate pour gérer "NA" ou "N/A"
function formatDate(dateString) {
    if (!dateString || dateString === 'NA' || dateString === 'N/A') return 'N/A';
    const date = new Date(dateString);
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatLastUpdated(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB');
}

function formatSocialLinks(twitter, telegram, discord, website) {
    const twitterHandle = twitter ? `@${twitter}` : '/';
    const twitterLink = twitter ? `<a href="https://twitter.com/${twitter}" target="_blank">${twitterHandle}</a>` : '/';

    const telegramUrl = telegram || '';
    const discordUrl = discord || '';
    let telegramDiscordLink = '/';

    if (telegramUrl && discordUrl) {
        telegramDiscordLink = `
            <a href="${telegramUrl}" target="_blank">${telegramUrl}</a>
            <br>
            <a href="${discordUrl}" target="_blank">${discordUrl}</a>
        `;
    } else if (telegramUrl) {
        telegramDiscordLink = `<a href="${telegramUrl}" target="_blank">${telegramUrl}</a>`;
    } else if (discordUrl) {
        telegramDiscordLink = `<a href="${discordUrl}" target="_blank">${discordUrl}</a>`;
    }

    const websiteLink = website ? `<a href="${website}" target="_blank">${website}</a>` : '/';

    return { twitterLink, telegramDiscordLink, websiteLink };
}

// Core data functions

// Load all tokens data
async function loadData() {
    try {
        const response = await fetchWithAuth('https://backend-finalsure.vercel.app/api/tokens');
        if (!response.ok) throw new Error('Failed to fetch tokens');
        
        const tokens = await response.json();
        if (!Array.isArray(tokens)) {
            throw new TypeError('Expected an array of tokens');
        }

        // Log summary of response
        console.log(`Total tokens received: ${tokens.length}`);
        
        const mainTableBody = document.querySelector('#mainTable tbody');
        mainTableBody.innerHTML = '';

        // Sort tokens by index if available
        tokens.sort((a, b) => {
            const aIndex = parseInt(a.index || a.tokenIndex || 0, 10);
            const bIndex = parseInt(b.index || b.tokenIndex || 0, 10);
            return aIndex - bIndex;
        });

        // STEP 1: Filter valid tokens (must have at least a name property)
        const validTokens = tokens.filter(token => 
            token && 
            typeof token === 'object' && 
            token.name && 
            typeof token.name === 'string' && 
            token.name.trim() !== ''
        );
        
        const invalidTokens = tokens.filter(token => 
            !token || 
            typeof token !== 'object' || 
            !token.name ||
            typeof token.name !== 'string' ||
            token.name.trim() === ''
        );
        
        console.log(`Valid tokens: ${validTokens.length}, Invalid tokens: ${invalidTokens.length}`);
        
        // STEP 2: Separate valid tokens into listed (with markPx) and unlisted (without markPx)
        const listedTokens = validTokens.filter(token => 
            token.markPx !== undefined && 
            token.markPx !== null && 
            token.markPx !== ''
        );
        
        const unlistedTokens = validTokens.filter(token => 
            token.markPx === undefined || 
            token.markPx === null || 
            token.markPx === ''
        );
        
        console.log(`Listed tokens (with markPx): ${listedTokens.length}`);
        console.log(`Unlisted tokens (without markPx): ${unlistedTokens.length}`);
        
        // Populate Listed Tokens table
        listedTokens.forEach((token, index) => {
            const sequentialIndex = index + 1;
            const socialLinks = formatSocialLinks(token.twitter, token.telegram, token.discord, token.website);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sequentialIndex}</td>
                <td>${token.name || 'N/A'}</td>
                <td>${formatDate(token.launchDate)}</td>
                <td>${token.teamAllocation || 'N/A'}</td>
                <td>${token.airdrop1 ? `${token.airdrop1.percentage}% ${token.airdrop1.token}` : '/'}</td>
                <td>${token.airdrop2 ? `${token.airdrop2.percentage}% ${token.airdrop2.token}` : '/'}</td>
                <td>${token.devTeamContact || 'N/A'}</td>
                <td>${token.markPx ? token.markPx + '$' : 'N/A'}</td>
                <td>${token.startPx ? token.startPx + '$' : 'N/A'}</td>
                <td>${formatMarketCap(token.launchMarketCap)}</td>
                <td>${formatNumber(token.launchCircSupply)}</td>
                <td>${socialLinks.twitterLink}</td>
                <td>${socialLinks.telegramDiscordLink}</td>
                <td>${socialLinks.websiteLink}</td>
                <td class="last-updated">${formatLastUpdated(token.lastUpdated)}</td>
            `;
            
            // Store token index for future reference
            row.dataset.tokenIndex = token.tokenIndex || token.index || index;
            mainTableBody.appendChild(row);
        });
        
        // Process and display unlisted tokens
        displayUnlistedTokens(unlistedTokens);

        // Update admin UI after loading data
        updateAdminUI();
        
        return tokens;
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data: ' + error.message, 'error');
        return [];
    }
}

/**
 * Display unlisted tokens in a table format
 * @param {Array} tokens - Array of token objects without markPx
 */
function displayUnlistedTokens(tokens) {
    const unlistedTable = document.getElementById('unlistedTokensTable');
    const noUnlistedMessage = document.getElementById('noUnlistedMessage');
    
    if (!unlistedTable || !noUnlistedMessage) {
        console.error("Unlisted tokens elements not found in the DOM");
        return;
    }
    
    const tableBody = unlistedTable.querySelector('tbody');
    tableBody.innerHTML = ''; // Clear existing content
    
    // Show/hide table based on tokens count
    if (!tokens || tokens.length === 0) {
        unlistedTable.style.display = 'none';
        noUnlistedMessage.style.display = 'block';
        return;
    }
    
    unlistedTable.style.display = 'table';
    noUnlistedMessage.style.display = 'none';
    
    // Create and add rows for each unlisted token
    tokens.forEach((token, index) => {
        const row = document.createElement('tr');
        
        // Get token index (use index, tokenIndex, or just array position)
        const tokenIndex = token.index || token.tokenIndex || index + 1;
        
        // Create badge HTML
        const badgeHtml = `<span class="status-badge coming-soon">Coming Soon</span>`;
        
        // Create row content
        row.innerHTML = `
            <td>${tokenIndex}</td>
            <td>${token.name || 'N/A'}</td>
            <td>${token.tokenId || 'N/A'}</td>
            <td>${badgeHtml}</td>
        `;
        
        // Store token data for potential future use
        row.dataset.tokenName = token.name || '';
        row.dataset.tokenId = token.tokenId || '';
        row.dataset.tokenIndex = tokenIndex;
        
        // Add click event to open token modal
        row.addEventListener('click', () => {
            openTokenModal(token.name);
        });
        
        // Add the row to the table
        tableBody.appendChild(row);
    });
    
    // Log completion message
    console.log(`Displayed ${tokens.length} unlisted tokens in table`);
}

// Find token row by name
function findTokenRow(ticker) {
    const table = document.getElementById('mainTable');
    const rows = table.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) { // Start at 1 to skip header row
        if (rows[i].cells && rows[i].cells[1] && rows[i].cells[1].textContent === ticker) {
            return rows[i];
        }
    }
    return null;
}

// Adaptation de loadTokenData pour les tokens non listés
async function loadTokenData(ticker) {
    try {
        const response = await fetchWithAuth('https://backend-finalsure.vercel.app/api/tokens');
        if (!response.ok) throw new Error('Failed to fetch tokens');
        
        const tokens = await response.json();
        const token = tokens.find(t => t.name === ticker);
        
        if (!token) {
            console.warn(`Token not found: ${ticker}`);
            return null;
        }
        
        // Remplir les champs avec les données disponibles ou vides
        document.getElementById('twitterHandle').value = token.twitter || '';
        
        // Choose either telegram or discord, preferring telegram if both exist
        let socialLink = '';
        if (token.telegram) {
            socialLink = token.telegram;
        } else if (token.discord) {
            socialLink = token.discord;
        }
        document.getElementById('telegramDiscord').value = socialLink;
        
        document.getElementById('website').value = token.website || '';
        document.getElementById('comments').value = token.comment || '';
        
        if (document.getElementById('projectDescription')) {
            document.getElementById('projectDescription').value = token.projectDescription || '';
        }
        
        if (document.getElementById('personalComment')) {
            document.getElementById('personalComment').value = token.personalComment || '';
        }
        
        document.getElementById('devTeamContact').value = token.devTeamContact || '';
        document.getElementById('modalLastUpdated').textContent = formatLastUpdated(token.lastUpdated);
        
        return token;
    } catch (error) {
        console.error('Error loading token data:', error);
        return null;
    }
}

// Admin-specific functions

// Update UI based on admin status
function updateAdminUI() {
    const adminStatus = isAdmin();
    
    // Show/hide admin-only elements
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = adminStatus ? 'block' : 'none';
    });
    
    // Add login/logout button to page if not already present
    if (!document.getElementById('loginPageButton') && !adminStatus) {
        const leftSection = document.querySelector('.left-section');
        if (leftSection) {
            const loginButton = document.createElement('button');
            loginButton.id = 'loginPageButton';
            loginButton.className = 'edit-button';
            loginButton.textContent = 'Admin Login';
            loginButton.addEventListener('click', () => {
                window.location.href = '/login.html';
            });
            leftSection.appendChild(loginButton);
        }
    }
    
    // Don't create a new logout button, just make sure the existing one has an event listener
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        // Remove any existing listeners to avoid duplicates
        const newLogoutButton = logoutButton.cloneNode(true);
        logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
        newLogoutButton.addEventListener('click', logout);
    }
    
    // Gestion du bouton de rafraîchissement
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        if (adminStatus) {
            refreshButton.style.display = 'block';
        } else {
            refreshButton.style.display = 'none';
        }
    }
}

// Handle login from login page
function setupLoginHandler() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('https://backend-finalsure.vercel.app/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                if (response.ok && data.token) {
                    localStorage.setItem('authToken', data.token);
                    window.location.href = '/index.html';
                } else {
                    alert('Login failed: ' + (data.message || 'Invalid credentials'));
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Error connecting to server');
            }
        });
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}

// Save token changes from modal
async function saveTokenChanges() {
    // Double-check admin status for security
    if (!isAdmin()) {
        alert('You must be an admin to save changes');
        // Reset UI to read-only state
        const inputs = document.querySelectorAll('#tickerModal input, #tickerModal textarea');
        inputs.forEach(input => {
            input.setAttribute('readonly', 'readonly');
            input.setAttribute('disabled', 'disabled');
            input.style.backgroundColor = 'var(--disabled-bg)';
            input.style.cursor = 'not-allowed';
        });
        // Hide save button
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.style.display = 'none';
        }
        return;
    }
    
    const ticker = document.getElementById('modalTitle').textContent;
    const row = findTokenRow(ticker);
    if (!row) {
        alert('Token not found');
        return;
    }
    
    // Use the original token index from the data attribute
    const tokenIndex = row.dataset.tokenIndex || row.cells[0].textContent;
    
    // Get the value from the telegramDiscord field
    const telegramDiscordValue = document.getElementById('telegramDiscord').value;
    
    // Determine if it's a Discord or Telegram link
    let telegramValue = '';
    let discordValue = '';
    
    if (telegramDiscordValue.includes('discord') || telegramDiscordValue.includes('discord.gg')) {
        discordValue = telegramDiscordValue;
    } else {
        // Default to Telegram for all other links
        telegramValue = telegramDiscordValue;
    }
    
    const data = {
        twitter: document.getElementById('twitterHandle').value,
        telegram: telegramValue,
        discord: discordValue,
        website: document.getElementById('website').value,
        comment: document.getElementById('comments').value,
        devTeamContact: document.getElementById('devTeamContact').value,
        lastUpdated: new Date().toISOString()
    };
    
    if (document.getElementById('projectDescription')) {
        data.projectDescription = document.getElementById('projectDescription').value;
    }
    
    if (document.getElementById('personalComment')) {
        data.personalComment = document.getElementById('personalComment').value;
    }
    
    try {
        const response = await fetchWithAuth(`https://backend-finalsure.vercel.app/api/tokens/${tokenIndex}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update token');
        }
        
        // Update last updated display
        document.getElementById('modalLastUpdated').textContent = formatLastUpdated(data.lastUpdated);
        
        // Visual feedback
        const saveButton = document.getElementById('saveButton');
        saveButton.textContent = 'Saved!';
        saveButton.style.backgroundColor = '#4CAF50';
        
        // Reset and close
        setTimeout(() => {
            saveButton.textContent = 'Save Changes';
            saveButton.style.backgroundColor = '';
            document.getElementById('tickerModal').style.display = 'none';
            
            // Reload data
            loadData();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes');
    }
}

// Edit panel functions
function openEditPanel() {
    if (!isAdmin()) {
        alert('Admin access required');
        return;
    }
    
    // Populate ticker dropdown
    const tickers = Array.from(document.querySelectorAll('#mainTable tbody tr'))
        .map(row => row.cells[1].textContent);
    
    const editTicker = document.getElementById('editTicker');
    editTicker.innerHTML = '<option value="">Select Ticker</option>' + 
        tickers.map(ticker => `<option value="${ticker}">${ticker}</option>`).join('');
    
    // Show panel
    const editPanel = document.getElementById('editPanel');
    editPanel.style.display = 'block';
    setTimeout(() => {
        editPanel.classList.add('active');
    }, 10);
}

function closeEditPanel() {
    const editPanel = document.getElementById('editPanel');
    editPanel.classList.remove('active');
    setTimeout(() => {
        editPanel.style.display = 'none';
    }, 300);
}

// Modification de saveEditedData pour accepter NA pour les dates
async function saveEditedData() {
    if (!isAdmin()) {
        alert('Admin access required');
        return;
    }
    
    const ticker = document.getElementById('editTicker').value;
    const column = document.getElementById('editColumn').value;
    const newValue = document.getElementById('editValue').value;
    
    if (!ticker || !column || newValue === undefined) {
        alert('Please fill in all fields');
        return;
    }
    
    const row = findTokenRow(ticker);
    if (!row) {
        alert('Ticker not found');
        return;
    }
    
    // Use the original token index from the data attribute
    const tokenIndex = row.dataset.tokenIndex || row.cells[0].textContent;
    
    // Map column names to field names
    const columnToField = {
        'Launch Date': 'launchDate',
        'Team Allocation': 'teamAllocation',
        'Airdrop 1': 'airdrop1',
        'Airdrop 2': 'airdrop2',
        'Dev/Team Contact': 'devTeamContact',
        'Auction Price': 'auctionPx',
        'Launch Price': 'startPx',
        'Launch Marketcap': 'launchMarketCap',
        'Launch Circ Supply': 'launchCircSupply',
        'Twitter Handle': 'twitter',
        'Telegram/Discord': 'telegram',
        'Website': 'website'
    };
    
    const field = columnToField[column];
    if (!field) {
        alert('Invalid column selection');
        return;
    }
    
    // Format data appropriately
    const data = {
        lastUpdated: new Date().toISOString()
    };
    
    // Special handling for launchDate
    if (field === 'launchDate') {
        // Si NA ou N/A ou vide, on enregistre "NA"
        if (newValue === 'NA' || newValue === 'N/A' || newValue === '') {
            data[field] = 'NA';
        } else {
            data[field] = newValue;
        }
    }
    // Special handling for airdrop fields
    else if (field === 'airdrop1' || field === 'airdrop2') {
        const parts = newValue.split(' ');
        let percentage = parts[0].replace('%', '');
        const token = parts.slice(1).join(' ');
        data[field] = { percentage, token };
    } else {
        data[field] = newValue;
    }
    
    try {
        const response = await fetchWithAuth(`https://backend-finalsure.vercel.app/api/tokens/${tokenIndex}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update token');
        }
        
        alert('Data updated successfully');
        closeEditPanel();
        loadData(); // Reload the table
        
    } catch (error) {
        console.error('Error updating token:', error);
        alert('Error updating data');
    }
}

// Token modal functions - Adaptation pour les tokens sans markPx
async function openTokenModal(ticker) {
    // Set modal title
    document.getElementById('modalTitle').textContent = ticker;
    
    // Display modal first to montrer un indicateur de chargement si nécessaire
    document.getElementById('tickerModal').style.display = 'block';
    
    // Afficher explicitement la grille de cases à cocher
    if (document.querySelector('.checkbox-grid')) {
        document.querySelector('.checkbox-grid').style.display = 'grid';
    }
    
    // Load token data and wait for it to complete
    const token = await loadTokenData(ticker);
    
    // Si c'est un token non listé avec peu de données, gérer spécialement
    const isMinimalToken = token && !token.markPx;
    if (isMinimalToken) {
        console.log("Token minimal détecté:", ticker);
    }
    
    // Set fields based on admin status AFTER data is loaded
    const isUserAdmin = isAdmin();
    console.log("Admin status when opening modal:", isUserAdmin);
    
    // Enable/disable inputs and controls - Force with both disabled and readonly attributes
    document.querySelectorAll('#tickerModal input, #tickerModal textarea').forEach(input => {
        if (!isUserAdmin) {
            input.setAttribute('readonly', 'readonly');
            input.setAttribute('disabled', 'disabled');
            input.style.backgroundColor = 'var(--disabled-bg)';
            input.style.cursor = 'not-allowed';
            input.style.opacity = '0.7';
        } else {
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
            input.style.backgroundColor = 'var(--bg-color)';
            input.style.cursor = 'text';
            input.style.opacity = '1';
        }
    });
    
    // Apply the same to checkbox inputs if they exist
    document.querySelectorAll('#tickerModal .checkbox-item input').forEach(cb => {
        if (!isUserAdmin) {
            cb.setAttribute('disabled', 'disabled');
            cb.style.cursor = 'not-allowed';
        } else {
            cb.removeAttribute('disabled');
            cb.style.cursor = 'pointer';
        }
    });
    
    // Show/hide save button de manière explicite
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        if (!isUserAdmin) {
            saveButton.style.display = 'none';
        } else {
            saveButton.style.display = 'block';
            saveButton.style.backgroundColor = '#22543D';
            saveButton.style.color = 'white';
            saveButton.style.margin = '0.6rem 0 0 0';
            saveButton.style.padding = '0.5rem 1rem';
            saveButton.style.border = 'none';
            saveButton.style.borderRadius = '8px';
        }
    }
    
    // Activer l'expansion des sections sociales pour faciliter l'édition
    const socialContent = document.querySelector('.social-links-content');
    if (socialContent) {
        socialContent.classList.add('active');
    }
    
    // S'assurer que l'icône est rotée correctement
    const toggleIcon = document.querySelector('.toggle-icon');
    if (toggleIcon) {
        toggleIcon.classList.add('active');
    }
}

// Toggle social links section in modal
function toggleSocialLinks() {
    const content = document.querySelector('.social-links-content');
    const icon = document.querySelector('.toggle-icon');
    
    if (content) {
        content.classList.toggle('active');
    }
    
    if (icon) {
        icon.classList.toggle('active');
    }
}

// Sort table functionality
let currentSortColumn = 0;
let isAscending = true;

function sortTable(columnIndex) {
    const table = document.getElementById('mainTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Update sort direction
    if (currentSortColumn === columnIndex) {
        isAscending = !isAscending;
    } else {
        isAscending = true;
        currentSortColumn = columnIndex;
    }
    
    // Clear all sort indicators
    document.querySelectorAll('#mainTable th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add indicator to current sort column
    const header = table.querySelector(`th:nth-child(${columnIndex + 1})`);
    header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    
    // Sort rows
    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();
        
        // Handle different data types
        if (aValue.includes('$')) {
            aValue = parseFloat(aValue.replace(/[^\d.-]/g, '')) || 0;
            bValue = parseFloat(bValue.replace(/[^\d.-]/g, '')) || 0;
        } else if (!isNaN(parseFloat(aValue))) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        }
        
        // Compare values
        if (aValue < bValue) return isAscending ? -1 : 1;
        if (aValue > bValue) return isAscending ? 1 : -1;
        return 0;
    });
    
    // Replace rows in tbody
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

// Theme toggling
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    const icon = themeToggle.querySelector('i');
    if (icon) {
        icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (icon) {
            icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    });
}

// Fonctions pour le rafraîchissement des données
async function refreshData() {
    // Vérification de l'authentification
    if (!isAdmin()) {
        showNotification('Admin access required', 'error');
        return;
    }
    
    // Récupérer le bouton et son icône
    const refreshButton = document.getElementById('refreshButton');
    const refreshIcon = refreshButton.querySelector('i');
    
    try {
        // Mettre à jour l'interface pour indiquer le chargement
        refreshButton.disabled = true;
        refreshIcon.classList.add('spinning');
        
        // Afficher notification de début de mise à jour
        showNotification('Refreshing data...', 'info');
        
        // Appeler l'API pour déclencher la mise à jour
        const response = await fetchWithAuth('https://backend-finalsure.vercel.app/api/tokens/refresh', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to update data');
        }
        
        // Mise à jour réussie
        showNotification('Data updated successfully!', 'success');
        
        // Recharger les données pour mettre à jour l'interface
        await loadData();
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        showNotification('Error refreshing data. Please try again.', 'error');
    } finally {
        // Rétablir l'état du bouton
        refreshButton.disabled = false;
        refreshIcon.classList.remove('spinning');
    }
}

// Fonction pour afficher les notifications
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    // Définir le message et le type
    messageElement.textContent = message;
    
    // Retirer toutes les classes de type
    notification.classList.remove('success', 'error', 'info');
    
    // Ajouter la classe correspondant au type
    notification.classList.add(type);
    
    // Afficher la notification
    notification.classList.add('show');
    
    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Fonction pour masquer la notification
function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
}

// Initialize everything
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme
    initTheme();
    
    // Set up login form if on login page
    setupLoginHandler();
    
    // Check if user is on main page
    if (document.getElementById('mainTable')) {
        // Load data and populate table
        await loadData();
        
        // Set up table sorting
        document.querySelectorAll('#mainTable th').forEach((header, index) => {
            header.addEventListener('click', () => sortTable(index));
        });
        
        // Set up row click to open modal
        document.querySelector('#mainTable tbody').addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) {
                const ticker = row.cells[1].textContent;
                openTokenModal(ticker);
            }
        });
        
        // Set up search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll('#mainTable tbody tr').forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
        }
        
        // Set up admin controls
        const editButton = document.getElementById('editButton');
        const cancelButton = document.getElementById('cancelButton');
        const saveEditButton = document.getElementById('saveEditButton');
        const saveButton = document.getElementById('saveButton');
        const modalCloseButton = document.querySelector('#tickerModal .close');
        const logoutButton = document.getElementById('logoutButton');
        const refreshButton = document.getElementById('refreshButton');
        const closeNotificationButton = document.getElementById('closeNotification');
        
        if (editButton) {
            editButton.addEventListener('click', openEditPanel);
        }
        
        if (cancelButton) {
            cancelButton.addEventListener('click', closeEditPanel);
        }
        
        if (saveEditButton) {
            saveEditButton.addEventListener('click', saveEditedData);
        }
        
        if (saveButton) {
            saveButton.addEventListener('click', saveTokenChanges);
        }
        
        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', () => {
                document.getElementById('tickerModal').style.display = 'none';
            });
        }
        
        // Ensure logout button has event listener
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
        
        // Ensure refresh button has event listener
        if (refreshButton) {
            refreshButton.addEventListener('click', refreshData);
        }
        
        // Gestion du bouton de fermeture des notifications
        if (closeNotificationButton) {
            closeNotificationButton.addEventListener('click', hideNotification);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('tickerModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Update admin UI
    updateAdminUI();
});
