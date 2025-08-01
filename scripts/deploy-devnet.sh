#!/bin/bash

echo "🚀 Deploying Multi-Treasury to Devnet..."

# Set Solana config to devnet
echo "📡 Setting Solana config to devnet..."
solana config set --url https://api.devnet.solana.com

# Check balance
echo "💰 Checking wallet balance..."
solana balance

# Build the program
echo "🔨 Building program..."
anchor build

# Generate IDL
echo "📄 Generating IDL..."
anchor idl init --filepath target/idl/multi_treasury.json 4fmeXVrnzWs6hTRM6rYLaYk26FzPxRmBFkHUmp9Vw3cV

# Deploy to devnet
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo "✅ Deployment complete!"
echo ""
echo "Program ID: 4fmeXVrnzWs6hTRM6rYLaYk26FzPxRmBFkHUmp9Vw3cV"
echo "Network: Devnet"
echo ""
echo "Next steps:"
echo "1. Copy the generated IDL to frontend"
echo "2. Start frontend: cd frontend && npm run dev"
