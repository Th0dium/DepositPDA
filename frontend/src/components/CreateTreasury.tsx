import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useProgram } from '../hooks/useProgram';

interface CreateTreasuryProps {
    onTreasuryCreated: () => void;
}

export const CreateTreasury: React.FC<CreateTreasuryProps> = ({ onTreasuryCreated }) => {
    const [treasuryName, setTreasuryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { publicKey } = useWallet();
    const { program } = useProgram();

    const handleCreateTreasury = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!publicKey || !program || !treasuryName.trim()) {
            setError('Please connect wallet and enter treasury name');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Find treasury PDA
            const [treasuryPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from('treasury'),
                    publicKey.toBuffer(),
                    Buffer.from(treasuryName.trim())
                ],
                program.programId
            );

            // Create treasury
            await program.methods
                .initializeTreasury(treasuryName.trim())
                .accounts({
                    treasury: treasuryPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            setTreasuryName('');
            onTreasuryCreated();
        } catch (err: any) {
            console.error('Error creating treasury:', err);
            setError(err.message || 'Failed to create treasury');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Create New Treasury</h2>
            
            <form onSubmit={handleCreateTreasury} className="space-y-4">
                <div>
                    <label htmlFor="treasuryName" className="block text-sm font-medium text-gray-700 mb-2">
                        Treasury Name
                    </label>
                    <input
                        type="text"
                        id="treasuryName"
                        value={treasuryName}
                        onChange={(e) => setTreasuryName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter treasury name"
                        disabled={isLoading}
                        required
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !publicKey}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Creating...' : 'Create Treasury'}
                </button>
            </form>
        </div>
    );
};
