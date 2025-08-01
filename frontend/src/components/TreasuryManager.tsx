import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils, BN } from '@coral-xyz/anchor';

// IDL type (simplified for this example)
const IDL = {
  "version": "0.1.0",
  "name": "multi_treasury",
  "instructions": [
    {
      "name": "initializeTreasury",
      "accounts": [
        { "name": "treasury", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "name", "type": "string" }]
    },
    {
      "name": "deposit",
      "accounts": [
        { "name": "treasury", "isMut": true, "isSigner": false },
        { "name": "depositor", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    },
    {
      "name": "withdraw",
      "accounts": [
        { "name": "treasury", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": false, "isSigner": true },
        { "name": "recipient", "isMut": true, "isSigner": false }
      ],
      "args": [
        { "name": "amount", "type": "u64" },
        { "name": "recipient", "type": "publicKey" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Treasury",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "name", "type": "string" },
          { "name": "authority", "type": "publicKey" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
};

const PROGRAM_ID = new PublicKey("4fmeXVrnzWs6hTRM6rYLaYk26FzPxRmBFkHUmp9Vw3cV");

interface Treasury {
  publicKey: PublicKey;
  account: {
    name: string;
    authority: PublicKey;
    bump: number;
  };
  balance: number;
}

const TreasuryManager: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [newTreasuryName, setNewTreasuryName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedTreasury, setSelectedTreasury] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getProvider = () => {
    if (!publicKey) return null;
    return new AnchorProvider(connection, window.solana, {});
  };

  const getProgram = () => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program(IDL as any, PROGRAM_ID, provider);
  };

  const getTreasuryPDA = (authority: PublicKey, name: string) => {
    return PublicKey.findProgramAddressSync(
      [
        utils.bytes.utf8.encode("treasury"),
        authority.toBuffer(),
        utils.bytes.utf8.encode(name),
      ],
      PROGRAM_ID
    );
  };

  const loadTreasuries = async () => {
    if (!publicKey) return;
    
    try {
      const program = getProgram();
      if (!program) return;

      // Get all treasury accounts for this authority
      const treasuryAccounts = await program.account.treasury.all([
        {
          memcmp: {
            offset: 8 + 4 + 50, // Skip discriminator + string length + max string
            bytes: publicKey.toBase58(),
          },
        },
      ]);

      const treasuriesWithBalance = await Promise.all(
        treasuryAccounts.map(async (treasury) => {
          const balance = await connection.getBalance(treasury.publicKey);
          return {
            publicKey: treasury.publicKey,
            account: treasury.account as any,
            balance: balance / LAMPORTS_PER_SOL,
          };
        })
      );

      setTreasuries(treasuriesWithBalance);
    } catch (error) {
      console.error('Error loading treasuries:', error);
    }
  };

  useEffect(() => {
    if (publicKey) {
      loadTreasuries();
    }
  }, [publicKey]);

  const createTreasury = async () => {
    if (!publicKey || !newTreasuryName.trim()) return;

    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const [treasuryPDA] = getTreasuryPDA(publicKey, newTreasuryName);

      const tx = await program.methods
        .initializeTreasury(newTreasuryName)
        .accounts({
          treasury: treasuryPDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      setNewTreasuryName('');
      await loadTreasuries();
      alert('Treasury created successfully!');
    } catch (error) {
      console.error('Error creating treasury:', error);
      alert('Error creating treasury');
    } finally {
      setLoading(false);
    }
  };

  const depositToTreasury = async () => {
    if (!publicKey || !selectedTreasury || !depositAmount) return;

    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const treasuryPubkey = new PublicKey(selectedTreasury);
      const amount = new BN(parseFloat(depositAmount) * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .deposit(amount)
        .accounts({
          treasury: treasuryPubkey,
          depositor: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      setDepositAmount('');
      await loadTreasuries();
      alert('Deposit successful!');
    } catch (error) {
      console.error('Error depositing:', error);
      alert('Error depositing to treasury');
    } finally {
      setLoading(false);
    }
  };

  const withdrawFromTreasury = async () => {
    if (!publicKey || !selectedTreasury || !withdrawAmount || !recipientAddress) return;

    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const treasuryPubkey = new PublicKey(selectedTreasury);
      const recipient = new PublicKey(recipientAddress);
      const amount = new BN(parseFloat(withdrawAmount) * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .withdraw(amount, recipient)
        .accounts({
          treasury: treasuryPubkey,
          authority: publicKey,
          recipient: recipient,
        })
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      setWithdrawAmount('');
      setRecipientAddress('');
      await loadTreasuries();
      alert('Withdrawal successful!');
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Error withdrawing from treasury');
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please connect your wallet to manage treasuries.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Create Treasury */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Create New Treasury</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Treasury name"
            value={newTreasuryName}
            onChange={(e) => setNewTreasuryName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createTreasury}
            disabled={loading || !newTreasuryName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Treasury'}
          </button>
        </div>
      </div>

      {/* Treasury List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Treasuries</h2>
        {treasuries.length === 0 ? (
          <p className="text-gray-600">No treasuries found. Create your first treasury above.</p>
        ) : (
          <div className="space-y-4">
            {treasuries.map((treasury) => (
              <div key={treasury.publicKey.toString()} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{treasury.account.name}</h3>
                    <p className="text-sm text-gray-600">
                      Address: {treasury.publicKey.toString().slice(0, 8)}...{treasury.publicKey.toString().slice(-8)}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      Balance: {treasury.balance.toFixed(4)} SOL
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Deposit SOL</h2>
        <div className="space-y-4">
          <select
            value={selectedTreasury}
            onChange={(e) => setSelectedTreasury(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a treasury</option>
            {treasuries.map((treasury) => (
              <option key={treasury.publicKey.toString()} value={treasury.publicKey.toString()}>
                {treasury.account.name} ({treasury.balance.toFixed(4)} SOL)
              </option>
            ))}
          </select>
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Amount in SOL"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.001"
              min="0"
            />
            <button
              onClick={depositToTreasury}
              disabled={loading || !selectedTreasury || !depositAmount}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Depositing...' : 'Deposit'}
            </button>
          </div>
        </div>
      </div>

      {/* Withdraw */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Withdraw SOL</h2>
        <div className="space-y-4">
          <select
            value={selectedTreasury}
            onChange={(e) => setSelectedTreasury(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a treasury</option>
            {treasuries.map((treasury) => (
              <option key={treasury.publicKey.toString()} value={treasury.publicKey.toString()}>
                {treasury.account.name} ({treasury.balance.toFixed(4)} SOL)
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Recipient wallet address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Amount in SOL"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.001"
              min="0"
            />
            <button
              onClick={withdrawFromTreasury}
              disabled={loading || !selectedTreasury || !withdrawAmount || !recipientAddress}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Withdrawing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasuryManager;
