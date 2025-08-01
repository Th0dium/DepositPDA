import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useProgram } from '../hooks/useProgram';

interface Treasury {
    publicKey: PublicKey;
    account: {
        name: string;
        authority: PublicKey;
        bump: number;
    };
    balance: number;
}

interface TreasuryListProps {
    refresh: number;
}

export const TreasuryList: React.FC<TreasuryListProps> = ({ refresh }) => {
    const [treasuries, setTreasuries] = useState<Treasury[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTreasury, setSelectedTreasury] = useState<Treasury | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const { program } = useProgram();

    useEffect(() => {
        if (publicKey && program) {
            fetchTreasuries();
        }
    }, [publicKey, program, refresh]);

    const fetchTreasuries = async () => {
        if (!publicKey || !program) return;

        setIsLoading(true);
        try {
            // Get all treasury accounts for this authority
            const treasuryAccounts = await program.account.treasury.all([
                {
                    memcmp: {
                        offset: 8 + 4 + 32, // Skip discriminator + name length + name
                        bytes: publicKey.toBase58(),
                    }
                }
            ]);

            // Get balances for each treasury
            const treasuriesWithBalance = await Promise.all(
                treasuryAccounts.map(async (treasury) => {
                    const balance = await connection.getBalance(treasury.publicKey);
                    return {
                        ...treasury,
                        balance: balance / LAMPORTS_PER_SOL
                    };
                })
            );

            setTreasuries(treasuriesWithBalance);
        } catch (err) {
            console.error('Error fetching treasuries:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeposit = async () => {
        if (!selectedTreasury || !program || !publicKey || !depositAmount) return;

        setActionLoading(true);
        setError(null);

        try {
            const amount = parseFloat(depositAmount) * LAMPORTS_PER_SOL;
            
            await program.methods
                .deposit(new (program.provider as any).BN(amount))
                .accounts({
                    treasury: selectedTreasury.publicKey,
                    from: publicKey,
                    systemProgram: PublicKey.default,
                })
                .rpc();

            setDepositAmount('');
            fetchTreasuries();
        } catch (err: any) {
            console.error('Error depositing:', err);
            setError(err.message || 'Failed to deposit');
        } finally {
            setActionLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!selectedTreasury || !program || !publicKey || !withdrawAmount || !recipientAddress) return;

        setActionLoading(true);
        setError(null);

        try {
            const amount = parseFloat(withdrawAmount) * LAMPORTS_PER_SOL;
            const recipient = new PublicKey(recipientAddress);
            
            await program.methods
                .withdraw(new (program.provider as any).BN(amount), recipient)
                .accounts({
                    treasury: selectedTreasury.publicKey,
                    authority: publicKey,
                    recipient: recipient,
                })
                .rpc();

            setWithdrawAmount('');
            setRecipientAddress('');
            fetchTreasuries();
        } catch (err: any) {
            console.error('Error withdrawing:', err);
            setError(err.message || 'Failed to withdraw');
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-8">Loading treasuries...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Your Treasuries</h2>
            
            {treasuries.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                    No treasuries found. Create your first treasury above.
                </div>
            ) : (
                <div className="grid gap-4">
                    {treasuries.map((treasury) => (
                        <div
                            key={treasury.publicKey.toString()}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedTreasury?.publicKey.equals(treasury.publicKey)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onClick={() => setSelectedTreasury(treasury)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold">{treasury.account.name}</h3>
                                    <p className="text-sm text-gray-600">
                                        {treasury.publicKey.toString().slice(0, 8)}...
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{treasury.balance.toFixed(4)} SOL</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedTreasury && (
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">
                        Manage: {selectedTreasury.account.name}
                    </h3>
                    
                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Deposit Section */}
                        <div>
                            <h4 className="font-medium mb-2">Deposit SOL</h4>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    step="0.001"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="Amount in SOL"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    disabled={actionLoading}
                                />
                                <button
                                    onClick={handleDeposit}
                                    disabled={actionLoading || !depositAmount}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {actionLoading ? 'Depositing...' : 'Deposit'}
                                </button>
                            </div>
                        </div>

                        {/* Withdraw Section */}
                        <div>
                            <h4 className="font-medium mb-2">Withdraw SOL</h4>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    step="0.001"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Amount in SOL"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    disabled={actionLoading}
                                />
                                <input
                                    type="text"
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                    placeholder="Recipient wallet address"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    disabled={actionLoading}
                                />
                                <button
                                    onClick={handleWithdraw}
                                    disabled={actionLoading || !withdrawAmount || !recipientAddress}
                                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                                >
                                    {actionLoading ? 'Withdrawing...' : 'Withdraw'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
