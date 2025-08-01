use anchor_lang::prelude::*;

declare_id!("4fmeXVrnzWs6hTRM6rYLaYk26FzPxRmBFkHUmp9Vw3cV");

#[program]
pub mod multi_treasury {
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
        let treasury_key = treasury.key();
        let authority_key = treasury.authority;
        let bump = treasury.bump;

        let seeds = &[
            b"treasury",
            authority_key.as_ref(),
            treasury.name.as_bytes(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        **ctx.accounts.treasury.to_account_info().try_borrow_mut_lamports()? -= amount;
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
        seeds = [b"treasury", treasury.authority.as_ref(), treasury.name.as_bytes()],
        bump = treasury.bump,
        has_one = authority
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
