import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MultiTreasury } from "../target/types/multi_treasury";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("multi-treasury", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MultiTreasury as Program<MultiTreasury>;
  const provider = anchor.AnchorProvider.env();

  it("Initialize Treasury", async () => {
    const treasuryName = "test-treasury";
    const authority = provider.wallet.publicKey;

    const [treasuryPDA] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("treasury"),
        authority.toBuffer(),
        anchor.utils.bytes.utf8.encode(treasuryName),
      ],
      program.programId
    );

    await program.methods
      .initializeTreasury(treasuryName)
      .accounts({
        treasury: treasuryPDA,
        authority: authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const treasuryAccount = await program.account.treasury.fetch(treasuryPDA);
    expect(treasuryAccount.name).to.equal(treasuryName);
    expect(treasuryAccount.authority.toString()).to.equal(authority.toString());
  });

  it("Deposit to Treasury", async () => {
    const treasuryName = "test-treasury";
    const authority = provider.wallet.publicKey;
    const depositAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

    const [treasuryPDA] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("treasury"),
        authority.toBuffer(),
        anchor.utils.bytes.utf8.encode(treasuryName),
      ],
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(treasuryPDA);

    await program.methods
      .deposit(depositAmount)
      .accounts({
        treasury: treasuryPDA,
        depositor: authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const balanceAfter = await provider.connection.getBalance(treasuryPDA);
    expect(balanceAfter - balanceBefore).to.equal(depositAmount.toNumber());
  });

  it("Withdraw from Treasury", async () => {
    const treasuryName = "test-treasury";
    const authority = provider.wallet.publicKey;
    const withdrawAmount = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const recipient = anchor.web3.Keypair.generate().publicKey;

    const [treasuryPDA] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("treasury"),
        authority.toBuffer(),
        anchor.utils.bytes.utf8.encode(treasuryName),
      ],
      program.programId
    );

    const treasuryBalanceBefore = await provider.connection.getBalance(treasuryPDA);
    const recipientBalanceBefore = await provider.connection.getBalance(recipient);

    await program.methods
      .withdraw(withdrawAmount, recipient)
      .accounts({
        treasury: treasuryPDA,
        authority: authority,
        recipient: recipient,
      })
      .rpc();

    const treasuryBalanceAfter = await provider.connection.getBalance(treasuryPDA);
    const recipientBalanceAfter = await provider.connection.getBalance(recipient);

    expect(treasuryBalanceBefore - treasuryBalanceAfter).to.equal(withdrawAmount.toNumber());
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(withdrawAmount.toNumber());
  });
});
