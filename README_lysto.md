# Account Abstraction on Sepolia
Nexus deployed bundler and paymaster to sponsor transactions on sepolia
### Steps to send
- Build the repo:
```
yarn 
yarn preprocess
```
- Go into the folder:
```
cd packages/bundler
```
- Change the params in `src/unner/runopPaymaster.ts` and `src/unner/sendERC20.ts`:
    - Have added test private keys
    - Add sepolia rpc
```
const CHAIN_RPC=<SEPOLIA_RPC>
```
- Run the operation. This will create the smart wallet
*The fees will be paid by paymaster*
```
yarn run runop
```
- Send ERC token from smart wallet
```
yarn run sendERC
```

Thats how the paymaster pays your fee. You can replicate for any transaction on sepolia
