# Multi-Treasury Manager

A simple Solana dApp for managing multiple treasury PDAs with deposit and withdrawal functionality.

## Features

- **Create Treasury**: Initialize new treasury PDAs with custom names
- **Deposit SOL**: Anyone can deposit SOL into any treasury
- **Withdraw SOL**: Only treasury authority can withdraw SOL to any wallet
- **Treasury List**: View all treasuries owned by connected wallet
- **Phantom Wallet Integration**: Connect and interact using Phantom wallet

## Smart Contract

Built with Anchor Framework 0.31.1, the smart contract includes:

- `initialize_treasury(name)`: Create a new treasury PDA
- `deposit(amount)`: Deposit SOL into a treasury
- `withdraw(amount, recipient)`: Withdraw SOL from treasury to any address

Each treasury stores:
- `name`: String identifier
- `authority`: PublicKey of the owner
- `bump`: PDA bump seed

## Setup Instructions

### Prerequisites

- Node.js 16+
- Rust and Cargo
- Solana CLI
- Anchor CLI 0.31.1

### 1. Install Dependencies

```bash
# Install Anchor dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Build the Smart Contract

```bash
anchor build
```

### 3. Deploy to Localnet

```bash
# Start local validator
solana-test-validator

# Deploy the program
anchor deploy
```

### 4. Run Tests

```bash
anchor test
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Connect Wallet**: Click "Select Wallet" and connect your Phantom wallet
2. **Create Treasury**: Enter a name and click "Create Treasury"
3. **Deposit SOL**: Select a treasury, enter amount, and click "Deposit"
4. **Withdraw SOL**: Select a treasury, enter recipient address and amount, click "Withdraw"

## Project Structure

```
DepositPDA/
├── programs/
│   └── multi-treasury/
│       └── src/
│           └── lib.rs          # Smart contract
├── frontend/
│   └── src/
│       ├── App.tsx             # Main app component
│       └── components/
│           └── TreasuryManager.tsx  # Treasury management UI
├── tests/
│   └── multi-treasury.ts       # Smart contract tests
├── Anchor.toml                 # Anchor configuration
└── package.json               # Dependencies
```

## Development Notes

- Program ID: `Ct5ucmv16BvPs6fzXCMyQVmyoh7c1SZrMBpW3DRj5eMy`
- Network: Configured for Localnet (can be changed in Anchor.toml)
- Frontend uses Vite + React + Tailwind CSS
- Treasury PDAs are derived using: `["treasury", authority, name]`
