import json
import base58

# Read the keypair file
with open('./target/deploy/deposit_pda-keypair.json', 'r') as f:
    keypair_data = json.load(f)

# Get the first 32 bytes (public key)
public_key_bytes = bytes(keypair_data[:32])
program_id = base58.b58encode(public_key_bytes).decode('utf-8')

print(f"Program ID from deposit_pda-keypair.json: {program_id}")
