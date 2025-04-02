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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
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

        const mainTableBody = document.querySelector('#mainTable tbody');
        mainTableBody.innerHTML = '';

        // Sort tokens by index
        tokens.sort((a, b) => {
            const aIndex = parseInt(a.tokenIndex, 10) || 0;
            const bIndex = parseInt(b.tokenIndex, 10) || 0;
            return aIndex - bIndex;
        });

        // Populate table with tokens that have markPx value
        tokens.forEach(token => {
            if (token.markPx) {
                const socialLinks = formatSocialLinks(token.twitter, token.telegram, token.discord, token.website);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${token.tokenIndex}</td>
                    <td>${token.name}</td>
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
                
                mainTableBody.appendChild(row);
            }
        });

        // Update admin UI after loading data
        updateAdminUI();
        
        return tokens;
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
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

// Load specific token data for modal
async function loadTokenData(ticker) {
    try {
        const response = await fetchWithAuth('https://backend-finalsure.vercel.app/api/tokens');
        if (!response.ok) throw new Error('Failed to fetch tokens');
        
        const tokens = await response.json();
        const token = tokens.find(t => t.name === ticker);
        
        if (!token) {
            console.warn(`Token not found: ${ticker}`);
            return;
        }
        
        // Populate modal fields
        document.getElementById('devReputation').checked = token.devReputation || false;
        document.getElementById('spreadLessThanThree').checked = token.spreadLessThanThree || false;
        document.getElementById('thickObLiquidity').checked = token.thickObLiquidity || false;
        document.getElementById('noSellPressure').checked = token.noSellPressure || false;
        
        document.getElementById('twitterHandle').value = token.twitter || '';
        document.getElementById('telegramDiscord').value = token.telegram || token.discord || '';
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
    } catch (error) {
        console.error('Error loading token data:', error);
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
    
    if (!document.getElementById('logoutButton') && adminStatus) {
        const leftSection = document.querySelector('.left-section');
        if (leftSection) {
            const logoutButton = document.createElement('button');
            logoutButton.id = 'logoutButton';
            logoutButton.className = 'edit-button';
            logoutButton.textContent = 'Logout';
            logoutButton.addEventListener('click', logout);
            leftSection.appendChild(logoutButton);
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
    if (!isAdmin()) {
        alert('You must be an admin to save changes');
        return;
    }
    
    const ticker = document.getElementById('modalTitle').textContent;
    const row = findTokenRow(ticker);
    if (!row) {
        alert('Token not found');
        return;
    }
    
    const tokenIndex = parseInt(row.cells[0].textContent, 10);
    
    const data = {
        devReputation: document.getElementById('devReputation').checked,
        spreadLessThanThree: document.getElementById('spreadLessThanThree').checked,
        thickObLiquidity: document.getElementById('thickObLiquidity').checked,
        noSellPressure: document.getElementById('noSellPressure').checked,
        twitter: document.getElementById('twitterHandle').value,
        telegram: document.getElementById('telegramDiscord').value,
        discord: document.getElementById('telegramDiscord').value,
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

async function saveEditedData() {
    if (!isAdmin()) {
        alert('Admin access required');
        return;
    }
    
    const ticker = document.getElementById('editTicker').value;
    const column = document.getElementById('editColumn').value;
    const newValue = document.getElementById('editValue').value;
    
    if (!ticker || !column || !newValue) {
        alert('Please fill in all fields');
        return;
    }
    
    const row = findTokenRow(ticker);
    if (!row) {
        alert('Ticker not found');
        return;
    }
    
    const tokenIndex = parseInt(row.cells[0].textContent, 10);
    
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
    
    // Special handling for airdrop fields
    if (field === 'airdrop1' || field === 'airdrop2') {
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

// Token modal functions
function openTokenModal(ticker) {
    // Set modal title
    document.getElementById('modalTitle').textContent = ticker;
    
    // Load token data
    loadTokenData(ticker);
    
    // Set fields based on admin status
    const isUserAdmin = isAdmin();
    
    // Enable/disable inputs and controls
    document.querySelectorAll('#tickerModal input, #tickerModal textarea').forEach(input => {
        input.readOnly = !isUserAdmin;
        input.disabled = !isUserAdmin;
        input.style.backgroundColor = isUserAdmin ? 'var(--bg-color)' : 'var(--disabled-bg)';
        input.style.cursor = isUserAdmin ? 'text' : 'default';
    });
    
    document.querySelectorAll('#tickerModal .checkbox-item input').forEach(cb => {
        cb.disabled = !isUserAdmin;
        cb.style.cursor = isUserAdmin ? 'pointer' : 'default';
    });
    
    // Show/hide save button
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.style.display = isUserAdmin ? 'block' : 'none';
    }
    
    // Display modal
    document.getElementById('tickerModal').style.display = 'block';
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
