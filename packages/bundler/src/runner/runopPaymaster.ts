import { BigNumber, ethers, Wallet } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { SimpleAccountFactory__factory } from '@account-abstraction/contracts'
import { keccak256 } from 'ethers/lib/utils'
import { DeterministicDeployer, HttpRpcClient, SimpleAccountAPI } from '@account-abstraction/sdk'
import { PaymasterAPI } from './paymasterApi'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

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


async function main(): Promise<void> {
    const provider = new JsonRpcProvider(CHAIN_RPC)
    console.log("PRIVATE_KEY:", PRIVATE_KEY)

    const account = new Wallet(PRIVATE_KEY, provider)
    const dep = new DeterministicDeployer(provider, account)
    const bundlerProvider: HttpRpcClient = new HttpRpcClient(BUNDLER_RPC, ENTRYPOINT, (await provider.getNetwork()).chainId)

    const newPaymaster = new PaymasterAPI()
    const accountApi: SimpleAccountAPI = new SimpleAccountAPI({
        provider: provider,
        entryPointAddress: ENTRYPOINT,
        factoryAddress: FACTORY,
        owner: account,
        paymasterAPI: newPaymaster,
        index: 85,
    })

    const accountDeployer = await DeterministicDeployer.getAddress(new SimpleAccountFactory__factory(), 0, [ENTRYPOINT])
    console.log("Account deployer contract address:", accountDeployer)
    console.log("Is contract deployed at this address:", await dep.isContractDeployed(accountDeployer))


    const addr = await accountApi.getCounterFactualAddress()
    console.log("Counterfactual address for the account:", addr)
    
    if (await provider.getBalance(addr) < ethers.utils.parseEther("0.02")) {
        account.sendTransaction({
            to: addr,
            value: ethers.utils.parseEther("0.0005")
        }).then(async tx => await tx.wait())
    }

    const data = keccak256(Buffer.from('entryPoint()')).slice(0, 10)
    const userop = await accountApi.createUnsignedUserOp({
        target: addr,
        data: data,
        gasLimit: 10e5,
        maxFeePerGas: 121000,
        maxPriorityFeePerGas: 121000,
    })
    userop.verificationGasLimit = 1000000
    userop.preVerificationGas = 50000

    const userOp = await accountApi.signUserOp(userop)
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
    .catch(e => {
        console.log(e)
        process.exit(1)
    })
    .then(() => process.exit(0))
