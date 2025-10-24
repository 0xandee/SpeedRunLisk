import { Address } from "viem";
import { useContractLogs } from "~~/hooks/scaffold-eth";
import { replacer } from "~~/utils/scaffold-eth/common";

export const AddressLogsTab = ({ address }: { address: Address }) => {
  const { logs: contractLogs, isLoading } = useContractLogs(address);

  return (
    <div className="flex flex-col gap-3 p-4">
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="ml-4">Loading logs...</span>
        </div>
      ) : (
        <div className="mockup-code overflow-auto max-h-[500px]">
          <pre className="px-5 whitespace-pre-wrap break-words">
            {contractLogs.length === 0 ? (
              <div className="text-center p-4 text-gray-500">No logs found</div>
            ) : (
              contractLogs.map((log, i) => (
                <div key={i}>
                  <strong>Log:</strong> {JSON.stringify(log, replacer, 2)}
                </div>
              ))
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
