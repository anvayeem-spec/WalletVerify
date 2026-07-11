# WalletVerify

WalletVerify is a simple and elegant web application for verifying Ethereum addresses. It validates address format, checks EIP-55 checksum compliance, identifies whether an address belongs to a wallet or a smart contract, and fetches live on-chain data such as balance and transaction count using the Etherscan API.

> 🚀 **This is my first blockchain project.** I built WalletVerify to learn the fundamentals of Ethereum, blockchain APIs, wallet verification, and Web3 development while creating a practical tool that anyone can use.

## ✨ Features

* ✅ **Format Validation** — Checks whether an Ethereum address is structurally valid.
* 🔐 **EIP-55 Checksum Verification** — Detects and highlights checksum errors.
* 👛 **Address Type Detection** — Distinguishes between Externally Owned Accounts (EOAs) and Smart Contracts.
* 📊 **Live On-Chain Data** — Displays wallet balance and transaction count using the Etherscan API.
* 🎨 **Clean & Responsive UI** — Optimized for both desktop and mobile devices.
* ⚡ **No Backend Required** — Runs entirely in the browser.

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, Vanilla JavaScript
* **Styling:** Custom CSS (Modern Dark Theme)
* **Blockchain API:** Etherscan API v2
* **Cryptography:** `js-sha3` (Keccak-256 for EIP-55 checksum verification)

## 🚀 Live Demo

👉 https://walletverify1.netlify.app

## 📦 Getting Started

### Clone the Repository

```bash
git clone https://github.com/anvayeem-spec/WalletVerify.git
cd WalletVerify
```

### Run Locally

Since this is a static web application, simply open `index.html` in your browser, or use a local development server such as VS Code Live Server for the best experience.

## 💡 What I Learned

Building WalletVerify helped me gain hands-on experience with:

* Ethereum address validation
* EIP-55 checksum generation and verification
* Integrating the Etherscan API
* Fetching and displaying live blockchain data
* Building responsive web interfaces using Vanilla JavaScript
* Understanding the basics of Web3 development

## 🔮 Future Improvements

* Support for multiple EVM-compatible networks
* ENS (Ethereum Name Service) resolution
* Wallet connection using MetaMask
* Additional address analytics and transaction history
* Improved error handling and performance

## 🤝 Contributing

Contributions, suggestions, and feedback are always welcome. Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
