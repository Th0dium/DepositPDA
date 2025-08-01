import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DepositPda } from "../target/types/deposit_pda";
import { expect } from "chai";

describe("deposit-pda", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DepositPda as Program<DepositPda>;
  const provider = anchor.getProvider();

  // Test accounts
  let authority: anchor.web3.Keypair;
  let user: anchor.web3.Keypair;
  let recipient: anchor.web3.Keypair;
  let treasuryPda: anchor.web3.PublicKey;
  let treasuryBump: number;

  const treasuryName = "test-treasury";

  beforeEach(async () => {
    // Generate new keypairs for each test
    authority = anchor.web3.Keypair.generate();
    user = anchor.web3.Keypair.generate();
    recipient = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Find treasury PDA
    [treasuryPda, treasuryBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("treasury"),
        authority.publicKey.toBuffer(),
        Buffer.from(treasuryName)
      ],
      program.programId
    );
  });

  it("Initialize treasury", async () => {
    await program.methods
      .initializeTreasury(treasuryName)
      .accounts({
        treasury: treasuryPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Fetch the treasury account
    const treasuryAccount = await program.account.treasury.fetch(treasuryPda);
    
    expect(treasuryAccount.name).to.equal(treasuryName);
    expect(treasuryAccount.authority.toString()).to.equal(authority.publicKey.toString());
    expect(treasuryAccount.bump).to.equal(treasuryBump);
  });

  it("Deposit SOL to treasury", async () => {
    // Initialize treasury first
    await program.methods
      .initializeTreasury(treasuryName)
      .accounts({
        treasury: treasuryPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const depositAmount = 0.5 * anchor.web3.LAMPORTS_PER_SOL;
    const initialBalance = await provider.connection.getBalance(treasuryPda);

    // Deposit SOL
    await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        treasury: treasuryPda,
        from: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const finalBalance = await provider.connection.getBalance(treasuryPda);
    expect(finalBalance - initialBalance).to.equal(depositAmount);
  });

  it("Withdraw SOL from treasury", async () => {
    // Initialize treasury
    await program.methods
      .initializeTreasury(treasuryName)
      .accounts({
        treasury: treasuryPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const depositAmount = 1 * anchor.web3.LAMPORTS_PER_SOL;
    const withdrawAmount = 0.3 * anchor.web3.LAMPORTS_PER_SOL;

    // Deposit SOL first
    await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        treasury: treasuryPda,
        from: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const initialRecipientBalance = await provider.connection.getBalance(recipient.publicKey);
    const initialTreasuryBalance = await provider.connection.getBalance(treasuryPda);

    // Withdraw SOL
    await program.methods
      .withdraw(new anchor.BN(withdrawAmount), recipient.publicKey)
      .accounts({
        treasury: treasuryPda,
        authority: authority.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([authority])
      .rpc();

    const finalRecipientBalance = await provider.connection.getBalance(recipient.publicKey);
    const finalTreasuryBalance = await provider.connection.getBalance(treasuryPda);

    expect(finalRecipientBalance - initialRecipientBalance).to.equal(withdrawAmount);
    expect(initialTreasuryBalance - finalTreasuryBalance).to.equal(withdrawAmount);
  });

  it("Fails to withdraw with insufficient funds", async () => {
    // Initialize treasury
    await program.methods
      .initializeTreasury(treasuryName)
      .accounts({
        treasury: treasuryPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const withdrawAmount = 10 * anchor.web3.LAMPORTS_PER_SOL; // More than available

    try {
      await program.methods
        .withdraw(new anchor.BN(withdrawAmount), recipient.publicKey)
        .accounts({
          treasury: treasuryPda,
          authority: authority.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([authority])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InsufficientFunds");
    }
  });

  it("Fails to withdraw with wrong authority", async () => {
    const wrongAuthority = anchor.web3.Keypair.generate();
    
    // Airdrop to wrong authority
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(wrongAuthority.publicKey, anchor.web3.LAMPORTS_PER_SOL)
    );

    // Initialize treasury
    await program.methods
      .initializeTreasury(treasuryName)
      .accounts({
        treasury: treasuryPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const withdrawAmount = 0.1 * anchor.web3.LAMPORTS_PER_SOL;

    try {
      await program.methods
        .withdraw(new anchor.BN(withdrawAmount), recipient.publicKey)
        .accounts({
          treasury: treasuryPda,
          authority: wrongAuthority.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([wrongAuthority])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintHasOne");
    }
  });
});
