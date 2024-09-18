// runner script, to create

/**
 * a simple script runner, to test the bundler and API.
 * for a simple target method, we just call the "nonce" method of the account itself.
 */

import { BigNumber, ethers, Signer, Wallet } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { SimpleAccountFactory__factory } from '@account-abstraction/contracts'
import { formatEther, keccak256, parseEther } from 'ethers/lib/utils'
import { Command } from 'commander'
import fs from 'fs'
import { DeterministicDeployer, HttpRpcClient, SimpleAccountAPI, calcPreVerificationGas } from '@account-abstraction/sdk'
import {PaymasterAPI} from './paymasterApi'

const ENTRYPOINT="0xD1DA0921A6fD9e36D13d83bF2Bf2819292474cD9"
const BUNDLER_RPC="http://localhost:3000/rpc"
const CHAIN_RPC="http://13.127.174.82:8449"
const PAYMASTER="0x3AD71fe733325b9ef2046C206C09Aa5d600f800e"
const FACTORY="0x130758C05DfA5B853a3F3ffa75b13999b4CAf73e"
const PRIVATE_KEY=""

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
        owner: account,
        paymasterAPI: newPaymaster,
        index: 85,
      
      });
    const accountDeployer = await DeterministicDeployer.getAddress(new SimpleAccountFactory__factory(), 0, [ENTRYPOINT])
    console.log("=========1===========")
    console.log(accountDeployer)
    console.log(await dep.isContractDeployed(accountDeployer))
    // if (!await dep.isContractDeployed(accountDeployer)){
    //     await dep.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [ENTRYPOINT])
    // }

    
    const addr = await accountApi.getCounterFactualAddress()
    console.log(addr)
    console.log("=========2===========")
    if(await provider.getBalance(addr)<ethers.utils.parseEther("0.02")){
        account.sendTransaction({
            to: addr,
            value: ethers.utils.parseEther("0.0005")
          }).then(async tx => await tx.wait())
    }
    
    const data = keccak256(Buffer.from('entryPoint()')).slice(0, 10)
    // const userOp = await accountApi.createSignedUserOp({
    //     target: addr,
    //     data: data,
    //     gasLimit: 10e5,
    //     maxFeePerGas: 121000,
    //     maxPriorityFeePerGas: 121000,
          
    // }) 

    const userop = await accountApi.createUnsignedUserOp({
        target: addr,
        data: data,
        gasLimit: 10e5,
        maxFeePerGas: 121000,
        maxPriorityFeePerGas: 121000,
       
    })
    userop.verificationGasLimit = 1000000;
    userop.preVerificationGas = 50000;
    const userOp = await accountApi.signUserOp(userop)

    // userOp.verificationGasLimit = BigNumber.from("1000000")
    console.log(userOp)
    try {
      const userOpHash = await bundlerProvider.sendUserOpToBundler(userOp)
      const txid = await accountApi.getUserOpReceipt(userOpHash)
      console.log('reqId', userOpHash, 'txid=', txid)
    } catch (e: any) {
      console.log(e)
     }

    // const details = await bundlerProvider.estimateUserOpGas(userOp)
    // console.log("estimated gas", details)

}

void main()
  .catch(e => { console.log(e); process.exit(1) })
  .then(() => process.exit(0))
