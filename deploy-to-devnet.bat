@echo off
echo 🚀 Deploying Deposit PDA to Devnet...

echo 📡 Setting Solana config to devnet...
solana config set --url https://api.devnet.solana.com

echo 💰 Checking wallet balance...
solana balance

echo 🪂 Requesting airdrop if needed...
solana airdrop 2

echo 🔨 Building program...
anchor build

echo 🚀 Deploying to devnet...
anchor deploy --provider.cluster devnet

echo ✅ Deployment complete!
echo.
echo Program ID: 4fmeXVrnzWs6hTRM6rYLaYk26FzPxRmBFkHUmp9Vw3cV
echo Network: Devnet
echo.
echo Next steps:
echo 1. Start frontend: cd frontend && npm run dev
echo 2. Connect your Phantom wallet to devnet
echo 3. Test creating a treasury

pause
