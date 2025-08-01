const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Read the keypair file
const keypairData = JSON.parse(fs.readFileSync('./target/deploy/deposit_pda-keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

console.log('Program ID from deposit_pda-keypair.json:', keypair.publicKey.toString());
