// runner script, to create

/**
 * a simple script runner, to test the bundler and API.
 * for a simple target method, we just call the "nonce" method of the account itself.
 */

import { BigNumber, ethers, Signer, Wallet } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { formatEther, keccak256, parseEther } from 'ethers/lib/utils'
import { Command } from 'commander'
import { erc4337RuntimeVersion } from '@account-abstraction/utils'
import fs from 'fs'
import { DeterministicDeployer,SimpleAccountFactory__factory } from '@account-abstraction/utils'
import { HttpRpcClient, SimpleAccountAPI } from '@account-abstraction/sdk'
import { runBundler } from '../runBundler'
import { BundlerServer } from '../BundlerServer'
import { getNetworkProvider } from '../Config'
import {PaymasterAPI} from './paymasterApi'

const ENTRYPOINT="0x0000000071727De22E5E9d8BAf0edAc6f37da032"
const BUNDLER_RPC="http://13.213.15.4:3000/rpc"
const CHAIN_RPC="<SEPOLIA_RPC>"
const PAYMASTER="0x9a982AB8514f314d1bF34C16aDc866b56f203E42"
const FACTORY="0x45668c493c86b84b71e6c5ae836FEed4EdF8f1FC"
const PRIVATE_KEY="f0b74593e090acc85ee99dc5424d9496fb0bf35884de71e40819522f25879b5e"

async function sendERCToken(account:Signer, adddress:string) {
  const transferABI = [
    {
      name: "transfer",
      type: "function",
      inputs: [
        {
          name: "_to",
          type: "address",
        },
        {
          type: "uint256",
          name: "_tokens",
        },
      ],
      constant: false,
      outputs: [],
      payable: false,
    },
  ];
  
  const token = new ethers.Contract("0x32433AB22d596dbAf6051AdE091C3A8a31D0362F", transferABI,account);
  const amount = ethers.utils.parseEther("0.01");
  await token
    .transfer(adddress, amount)
    .then((transferResult: any) => {
      console.log("transferResult", transferResult);
    })
    .catch((error: any) => {
      console.error("Error", error);
  })
}
async function main (): Promise<void> {

    const provider = new JsonRpcProvider( CHAIN_RPC)
    console.log( PRIVATE_KEY)
    const account = new Wallet( PRIVATE_KEY,provider)
    const account2 = new Wallet("4340551fd9382d7b1154d7234a7ff0147d368f530656aadd859e380a7fda6598",provider)

    const dep = new DeterministicDeployer(provider,account)
    const bundlerProvider: HttpRpcClient = new HttpRpcClient( BUNDLER_RPC,  ENTRYPOINT, (await provider.getNetwork()).chainId)
    const newPaymaster = new PaymasterAPI();
    const accountApi: SimpleAccountAPI = new SimpleAccountAPI({
        provider: provider,
        entryPointAddress:  ENTRYPOINT,
        factoryAddress:  FACTORY,
        paymasterAPI: newPaymaster,
        owner: account,
        index: 15
      });
    const accountDeployer = await DeterministicDeployer.getAddress(new SimpleAccountFactory__factory(), 0, [ENTRYPOINT])
    console.log("=========1===========")
    console.log(accountDeployer)
    // if (!await dep.isContractDeployed(accountDeployer)){
    //     await dep.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [ENTRYPOINT])
    // }
    const addr = await accountApi.getCounterFactualAddress()
    console.log(addr)
    await sendERCToken(account2,addr)
    console.log("=========2===========")
    // if(await provider.getBalance(addr)<ethers.utils.parseEther("0.02")){
    //     account.sendTransaction({
    //         to: addr,
    //         value: ethers.utils.parseEther("0.05")
    //       }).then(async tx => await tx.wait())
    // }
    const data = keccak256(Buffer.from('name()')).slice(0, 10)
    const userOp = await accountApi.createSignedUserOp({
        target: "0x321426667b10c108C777046c65E8B2A615b40876",
        data: data,
        gasLimit: 1000000
    })
    console.log(userOp)
    try {
      const userOpHash = await bundlerProvider.sendUserOpToBundler(userOp)
      console.log("user operation sent")
      const txid = await accountApi.getUserOpReceipt(userOpHash)
      console.log('reqId', userOpHash, 'txid=', txid)
    } catch (e: any) {
      console.log(e)
    }
}

void main()
  .catch(e => { console.log(e); process.exit(1) })
  .then(() => process.exit(0))
