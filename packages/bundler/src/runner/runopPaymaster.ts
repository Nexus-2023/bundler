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
const BUNDLER_RPC="http://localhost:3000/rpc"
const CHAIN_RPC="https://eth-sepolia.g.alchemy.com/v2/8EbEVKiQ3VNG1kZdvAJXG73ylk50WaSB"
const PAYMASTER="0xf367aa1213b9C004aebDd5E805Dbb6d2CcAb9C1d"
const FACTORY="0x45668c493c86b84b71e6c5ae836FEed4EdF8f1FC"
const PRIVATE_KEY="045c49c2064bfc524784b77547c2c1f2a7d14c96b9c6078937753eaef3acf123"
async function main (): Promise<void> {

    const provider = new JsonRpcProvider( CHAIN_RPC)
    console.log( PRIVATE_KEY)
    const account = new Wallet( PRIVATE_KEY,provider)
    const dep = new DeterministicDeployer(provider,account)
    const bundlerProvider: HttpRpcClient = new HttpRpcClient( BUNDLER_RPC,  ENTRYPOINT, (await provider.getNetwork()).chainId)
    const newPaymaster = new PaymasterAPI();
    const accountApi: SimpleAccountAPI = new SimpleAccountAPI({
        provider: provider,
        entryPointAddress:  ENTRYPOINT,
        factoryAddress:  FACTORY,
        paymasterAPI: newPaymaster,
        owner: account,
        index: 1
      });
    const accountDeployer = await DeterministicDeployer.getAddress(new SimpleAccountFactory__factory(), 0, [ENTRYPOINT])
    console.log("=========1===========")
    console.log(accountDeployer)
    // if (!await dep.isContractDeployed(accountDeployer)){
    //     await dep.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [ENTRYPOINT])
    // }
    const addr = await accountApi.getCounterFactualAddress()
    console.log(addr)
    console.log("=========2===========")
    // if(await provider.getBalance(addr)<ethers.utils.parseEther("0.02")){
    //     account.sendTransaction({
    //         to: addr,
    //         value: ethers.utils.parseEther("0.05")
    //       }).then(async tx => await tx.wait())
    // }
    const data = keccak256(Buffer.from('entryPoint()')).slice(0, 10)
    const userOp = await accountApi.createSignedUserOp({
        target: addr,
        data: data
    })
    console.log(userOp)
    try {
      const userOpHash = await bundlerProvider.sendUserOpToBundler(userOp)
      const txid = await accountApi.getUserOpReceipt(userOpHash)
      console.log('reqId', userOpHash, 'txid=', txid)
    } catch (e: any) {
      console.log(e)
    }
}

void main()
  .catch(e => { console.log(e); process.exit(1) })
  .then(() => process.exit(0))
