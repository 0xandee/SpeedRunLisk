import { useEffect, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { Address, Log } from "viem";
import { usePublicClient } from "wagmi";

// Maximum block range allowed by most RPC providers
const MAX_BLOCK_RANGE = 90000n;

// Your deployment block number (update this to your actual deployment block)
const DEPLOYMENT_BLOCK = 27592684n;

export const useContractLogs = (address: Address) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { targetNetwork } = useTargetNetwork();
  const client = usePublicClient({ chainId: targetNetwork.id });

  useEffect(() => {
    const fetchLogsInChunks = async () => {
      if (!client) return console.error("Client not found");
      setIsLoading(true);
      try {
        const latestBlock = await client.getBlockNumber();
        const allLogs: Log[] = [];

        // Calculate how many chunks we need
        let currentFromBlock = DEPLOYMENT_BLOCK;

        console.log(`Fetching logs from block ${DEPLOYMENT_BLOCK} to ${latestBlock}`);

        while (currentFromBlock <= latestBlock) {
          const currentToBlock = currentFromBlock + MAX_BLOCK_RANGE > latestBlock
            ? latestBlock
            : currentFromBlock + MAX_BLOCK_RANGE;

          console.log(`Fetching chunk: ${currentFromBlock} to ${currentToBlock}`);

          const chunkLogs = await client.getLogs({
            address: address,
            fromBlock: currentFromBlock,
            toBlock: currentToBlock,
          });

          allLogs.push(...chunkLogs);
          currentFromBlock = currentToBlock + 1n;
        }

        console.log(`Total logs fetched: ${allLogs.length}`);
        setLogs(allLogs);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogsInChunks();

    return client?.watchBlockNumber({
      onBlockNumber: async (_blockNumber, prevBlockNumber) => {
        const newLogs = await client.getLogs({
          address: address,
          fromBlock: prevBlockNumber,
          toBlock: "latest",
        });
        setLogs(prevLogs => [...prevLogs, ...newLogs]);
      },
    });
  }, [address, client]);

  return { logs, isLoading };
};
