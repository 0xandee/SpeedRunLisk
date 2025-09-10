import { RecoverTypedDataAddressParameters, recoverTypedDataAddress } from "viem";

export const EIP_712_DOMAIN = {
  name: "SpeedRunLisk",
  version: "1",
  chainId: 4202,
  verifyingContract: "0x0000000000000000000000000000000000000000",
} as const;

export const isValidEip712Signature = async ({
  typedData,
  address,
}: {
  typedData: RecoverTypedDataAddressParameters;
  address: string;
}) => {
  const recoveredAddress = await recoverTypedDataAddress(typedData);
  return recoveredAddress.toLowerCase() === address.toLowerCase();
};
