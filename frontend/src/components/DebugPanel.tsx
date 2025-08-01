import React from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey("6QBn3UkBbx1VS4hPUkyBftb1NRnPDaKsnfdjuSMyvv2U");

const DebugPanel: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const runDebugTests = async () => {
    console.log('=== DEBUG TESTS ===');
    
    try {
      // Test 1: Connection
      console.log('1. Connection test...');
      console.log('RPC Endpoint:', connection.rpcEndpoint);
      const version = await connection.getVersion();
      console.log('✅ Connection OK, Solana version:', version);
      
      // Test 2: Wallet
      console.log('2. Wallet test...');
      console.log('Wallet connected:', connected);
      console.log('Public key:', publicKey?.toString());
      
      if (publicKey) {
        const balance = await connection.getBalance(publicKey);
        console.log('✅ Wallet balance:', balance / 1e9, 'SOL');
      }
      
      // Test 3: Program
      console.log('3. Program test...');
      console.log('Program ID:', PROGRAM_ID.toString());
      const programInfo = await connection.getAccountInfo(PROGRAM_ID);
      if (programInfo) {
        console.log('✅ Program exists on blockchain');
        console.log('Program owner:', programInfo.owner.toString());
        console.log('Program executable:', programInfo.executable);
      } else {
        console.log('❌ Program NOT found on blockchain');
      }
      
      // Test 4: Window.solana
      console.log('4. Phantom wallet test...');
      console.log('window.solana exists:', !!window.solana);
      console.log('window.solana.isPhantom:', window.solana?.isPhantom);
      
      console.log('=== DEBUG TESTS COMPLETE ===');
      alert('Debug tests complete - check console for results');
      
    } catch (error) {
      console.error('❌ Debug test failed:', error);
      alert('Debug test failed - check console');
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-red-800 mb-2">🔍 Debug Panel</h3>
      <p className="text-red-700 mb-3">
        Click to run comprehensive debug tests and check browser console for detailed results.
      </p>
      <button
        onClick={runDebugTests}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 mr-4"
      >
        Run Debug Tests
      </button>
      <div className="mt-2 text-sm text-red-600">
        <p>Network: {connection.rpcEndpoint}</p>
        <p>Wallet: {connected ? '✅ Connected' : '❌ Not connected'}</p>
        <p>Program ID: {PROGRAM_ID.toString()}</p>
      </div>
    </div>
  );
};

export default DebugPanel;
