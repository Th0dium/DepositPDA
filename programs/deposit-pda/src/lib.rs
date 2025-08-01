use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("6QBn3UkBbx1VS4hPUkyBftb1NRnPDaKsnfdjuSMyvv2U");

#[program]
pub mod deposit_pda {
    use super::*;

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>, name: String) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.name = name;
        treasury.authority = ctx.accounts.authority.key();
        treasury.bump = ctx.bumps.treasury;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.depositor.key(),
            &ctx.accounts.treasury.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.depositor.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
        )?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64, recipient: Pubkey) -> Result<()> {
        let treasury = &ctx.accounts.treasury;
        let treasury_info = treasury.to_account_info();
        
        // Check if treasury has enough balance
        if treasury_info.lamports() < amount {
            return Err(ErrorCode::InsufficientFunds.into());
        }
        
        // Transfer SOL from treasury PDA to recipient
        **treasury_info.try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury", authority.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"treasury", authority.key().as_ref(), treasury.name.as_bytes()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub authority: Signer<'info>,
    
    /// CHECK: This is the recipient account that will receive the withdrawn SOL
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    #[max_len(50)]
    pub name: String,
    pub authority: Pubkey,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds in treasury")]
    InsufficientFunds,
}
