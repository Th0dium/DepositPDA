#!/bin/bash

echo "🚀 Setting up Multi-Treasury Manager..."

# Install root dependencies
echo "📦 Installing Anchor dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Build the program
echo "🔨 Building smart contract..."
anchor build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start local validator: solana-test-validator"
echo "2. Deploy program: anchor deploy"
echo "3. Run tests: anchor test"
echo "4. Start frontend: cd frontend && npm run dev"
