import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// Import the IDL - you'll need to generate this from your Anchor program
import idl from '../idl/deposit_pda.json';

const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

export function useProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const provider = useMemo(() => {
        if (!wallet.publicKey) return null;
        
        return new AnchorProvider(
            connection,
            wallet as any,
            AnchorProvider.defaultOptions()
        );
    }, [connection, wallet]);

    const program = useMemo(() => {
        if (!provider) return null;
        
        return new Program(idl as Idl, PROGRAM_ID, provider);
    }, [provider]);

    return { program, provider };
}
