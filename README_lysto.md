# Account Abstraction on Sepolia
Nexus deployed bundler and paymaster to sponsor transactions on sepolia
### Steps to send
- Build the repo:
```
yarn 
yarn preprocess
```
- Change the params:
    - Have added test private keys
    - Add sepolia rpc
```
const CHAIN_RPC=<SEPOLIA_RPC>
```
- Run the operation
**The fees will be paid by paymaster**
```
yarn run runop
```
- Send ERC token
```
yarn run sendERC
```

Thats how the paymaster pays your fee. You can replicate for any transaction on sepolia
