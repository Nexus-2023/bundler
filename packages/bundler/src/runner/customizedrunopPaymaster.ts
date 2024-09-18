import { BigNumber, ethers, Wallet } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SimpleAccountFactory__factory } from '@account-abstraction/contracts';
import { DeterministicDeployer, HttpRpcClient, SimpleAccountAPI } from '@account-abstraction/sdk';
import { PaymasterAPI } from './paymasterApi';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Fetch environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? '';
const ENTRYPOINT = process.env.ENTRYPOINT ?? '';
const BUNDLER_RPC = process.env.BUNDLER_RPC ?? '';
const CHAIN_RPC = process.env.CHAIN_RPC ?? '';
const PAYMASTER = process.env.PAYMASTER ?? '';
const FACTORY = process.env.FACTORY ?? '';

if (!PRIVATE_KEY || !ENTRYPOINT || !BUNDLER_RPC || !CHAIN_RPC || !PAYMASTER || !FACTORY) {
    throw new Error('Missing required environment variables.');
}

// Generalized UserOperation function
async function sendUserOperation(targetContract: string, encodedData: string): Promise<void> {
    const provider = new JsonRpcProvider(CHAIN_RPC);
    const account = new Wallet(PRIVATE_KEY, provider);
    const dep = new DeterministicDeployer(provider, account);
    const bundlerProvider: HttpRpcClient = new HttpRpcClient(BUNDLER_RPC, ENTRYPOINT, (await provider.getNetwork()).chainId);

    const newPaymaster = new PaymasterAPI();
    const accountApi: SimpleAccountAPI = new SimpleAccountAPI({
        provider: provider,
        entryPointAddress: ENTRYPOINT,
        factoryAddress: FACTORY,
        owner: account,
        paymasterAPI: newPaymaster,
        index: 85, // Optional, can be dynamic as well
    });

    const accountDeployer = await DeterministicDeployer.getAddress(new SimpleAccountFactory__factory(), 0, [ENTRYPOINT]);
    console.log("=========1===========");
    console.log(accountDeployer);
    console.log(await dep.isContractDeployed(accountDeployer));

    const addr = await accountApi.getCounterFactualAddress();
    console.log(addr);
    console.log("=========2===========");

    // Ensure the contract address has some balance (replace with real balance-check logic)
    if (await provider.getBalance(addr) < ethers.utils.parseEther("0.02")) {
        account.sendTransaction({
            to: addr,
            value: ethers.utils.parseEther("0.0005")
        }).then(async tx => await tx.wait());
    }

    // Create a generalized UserOperation with dynamic target and encoded calldata
    const userop = await accountApi.createUnsignedUserOp({
        target: targetContract, // Correctly using the targetContract here for the contract address
        data: encodedData, // Dynamic encoded function call
        gasLimit: 10e5,
        maxFeePerGas: 121000, // Replace with actual maxFeePerGas
        maxPriorityFeePerGas: 121000
    });

    userop.verificationGasLimit = 1000000; // Adjust this based on your need
    userop.preVerificationGas = 50000; // Adjust this based on your need

    // Sign and send the user operation
    const signedUserOp = await accountApi.signUserOp(userop);
    console.log(signedUserOp);

    try {
        const userOpHash = await bundlerProvider.sendUserOpToBundler(signedUserOp);
        const txid = await accountApi.getUserOpReceipt(userOpHash);
        console.log('reqId', userOpHash, 'txid=', txid);
    } catch (e: any) {
        console.error(e);
    }
}

// Example usage
async function main(): Promise<void> {
    // Define the target contract and encoded data for any arbitrary smart contract interaction
    const targetContract = '0xTargetContractAddressHere'; // Replace with actual contract address
    const encodedData = '0xEncodedFunctionDataHere'; // Replace with actual encoded function data
    
    await sendUserOperation(targetContract, encodedData);
}

void main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .then(() => process.exit(0));
