
import { UserOperation } from '@account-abstraction/utils';
import { BigNumberish, BytesLike } from 'ethers';

/**
 * an API to external a UserOperation with paymaster info
 */
export interface PaymasterParams {
  paymaster: string;
  paymasterData?: BytesLike;
  paymasterVerificationGasLimit: BigNumberish;
  paymasterPostOpGasLimit: BigNumberish;
}
export class PaymasterAPI {
    /**
     * @param userOp a partially-filled UserOperation (without signature and paymasterAndData
     *  note that the "preVerificationGas" is incomplete: it can't account for the
     *  paymasterAndData value, which will only be returned by this method..
     * @returns the value to put into the PaymasterAndData, undefined to leave it empty
     */
    async getPaymasterData (userOp: Partial<UserOperation>): Promise<PaymasterParams | null> {
      const paymasterparam: PaymasterParams = {
        paymaster: "0xC1c7dd90239502eB87e87E585d4EbE9a9c3b8df8",
        paymasterVerificationGasLimit: 1000000,
        paymasterPostOpGasLimit:50000,
      }
      return paymasterparam;
    }

    async getTemporaryPaymasterData(userOp: Partial<UserOperation>): Promise<PaymasterParams | null>{
      const paymasterparam: PaymasterParams = {
        paymaster: "0xC1c7dd90239502eB87e87E585d4EbE9a9c3b8df8",
        paymasterVerificationGasLimit:1000000,
        paymasterPostOpGasLimit:50000,
      }
      return paymasterparam;    }

  }
