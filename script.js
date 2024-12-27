const tokens = [
    { name: "Ethereum", symbol: "ETH", price: "$1,820.55", image: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    { name: "Bitcoin", symbol: "BTC", price: "$28,400.20", image: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
    { name: "Solana", symbol: "SOL", price: "$21.37", image: "https://cryptologos.cc/logos/solana-sol-logo.png" },
    { name: "Ripple", symbol: "XRP", price: "$0.56", image: "https://cryptologos.cc/logos/xrp-xrp-logo.png" },
];

const container = document.getElementById('tokens-container');

tokens.forEach(token => {
    const tokenElement = document.createElement('div');
    tokenElement.classList.add('token');

    tokenElement.innerHTML = `
        <div class="token-name">
            <img src="${token.image}" alt="${token.name} logo">
            <span>${token.name} (${token.symbol})</span>
        </div>
        <div class="token-price">${token.price}</div>
    `;

    container.appendChild(tokenElement);
});
