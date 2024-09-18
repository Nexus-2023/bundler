import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function depositToPaymaster() {
    // Load environment variables
    const PRIVATE_KEY = process.env.PRIVATE_KEY_FOR_FUNDING_PAYMASTER;
    const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS;
    const PROVIDER_URL = process.env.PROVIDER_URL;

    console.log("PRIVATE_KEY:", PRIVATE_KEY);
    console.log("PAYMASTER_ADDRESS:", PAYMASTER_ADDRESS);
    console.log("PROVIDER_URL:", PROVIDER_URL);

    if (!PRIVATE_KEY || !PAYMASTER_ADDRESS || !PROVIDER_URL) {
        throw new Error("Missing required environment variables.");
    }

    // Connect to the network
    const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);

    // Create a signer from the private key
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Connect to the Paymaster contract
    const paymasterAbi = [
        "function deposit() public payable",
    ];
    const paymasterContract = new ethers.Contract(PAYMASTER_ADDRESS, paymasterAbi, signer);

    // Define the amount to deposit (in this example, 0.5 ETH)
    const depositAmount = ethers.utils.parseEther("0.0005"); // Change this to the desired amount

    try {
        // Call the deposit function on the paymaster contract
        const tx = await paymasterContract.deposit({ value: depositAmount });
        console.log("Transaction sent, awaiting confirmation...");

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log("Transaction confirmed!", receipt);
    } catch (error) {
        console.error("Error depositing to Paymaster:", error);
    }
}

// Execute the function
depositToPaymaster();
