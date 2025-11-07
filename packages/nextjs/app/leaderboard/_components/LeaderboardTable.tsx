"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useClaimReward } from "~~/hooks/useClaimReward";
import { LeaderboardEntry } from "~~/types/leaderboard";
import { notification } from "~~/utils/scaffold-eth";

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
}

export const LeaderboardTable = ({ data }: LeaderboardTableProps) => {
  const { address: connectedAddress } = useAccount();
  const [sorting, setSorting] = useState<SortingState>([{ id: "rank", desc: false }]);
  const [eligibleEntry, setEligibleEntry] = useState<LeaderboardEntry | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);

  // Use claim reward hook
  const { hasClaimed, isClaimPending, claim, allocationInLSK } = useClaimReward();

  // Check if connected wallet is eligible for rewards
  useEffect(() => {
    if (!connectedAddress) {
      setEligibleEntry(null);
      return;
    }

    // Find if the connected address matches any payout wallet
    const matchedEntry = data.find(
      entry => entry.payoutWallet.toLowerCase() === connectedAddress.toLowerCase(),
    );

    setEligibleEntry(matchedEntry || null);
  }, [connectedAddress, data]);

  // Handle claim button click
  const handleClaim = async () => {
    try {
      notification.info("Claiming your LSK tokens...");
      const txHash = await claim();

      if (txHash) {
        setClaimTxHash(txHash);
        notification.success(
          <div>
            <p className="font-bold">Tokens claimed successfully! 🎉</p>
            <a
              href={`https://blockscout.lisk.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View transaction
            </a>
          </div>,
        );
      }
    } catch (error: any) {
      console.error("Claim error:", error);

      // Handle specific error cases
      if (error.message?.includes("AlreadyClaimed")) {
        notification.error("You have already claimed your tokens!");
      } else if (error.message?.includes("NotWhitelisted")) {
        notification.error("You are not whitelisted for this reward.");
      } else if (error.message?.includes("Paused")) {
        notification.error("Claims are currently paused. Please try again later.");
      } else if (error.message?.includes("User rejected")) {
        notification.info("Transaction cancelled.");
      } else {
        notification.error("Failed to claim tokens. Please try again.");
      }
    }
  };

  // Achievement badge component
  const AchievementBadge = ({ achieved }: { achieved: boolean }) => (
    <span className={`text-lg font-bold ${achieved ? "text-success" : "text-base-300"}`}>{achieved ? "✓" : "✗"}</span>
  );

  // Define columns
  const columns = useMemo<ColumnDef<LeaderboardEntry>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "Rank",
        cell: info => <div className="font-bold text-primary">#{info.getValue() as number}</div>,
        size: 80,
      },
      {
        accessorKey: "telegram",
        header: "Telegram",
        cell: info => <div className="font-medium">{info.getValue() as string}</div>,
        size: 150,
      },
      {
        accessorKey: "fastestFinisher",
        header: () => (
          <div className="text-center">
            <div className="font-semibold">Fastest</div>
            <div className="text-xs font-normal opacity-70">Finisher</div>
          </div>
        ),
        cell: info => (
          <div className="flex justify-center">
            <AchievementBadge achieved={info.getValue() as boolean} />
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "bestProject",
        header: () => (
          <div className="text-center">
            <div className="font-semibold">Best</div>
            <div className="text-xs font-normal opacity-70">Project</div>
          </div>
        ),
        cell: info => (
          <div className="flex justify-center">
            <AchievementBadge achieved={info.getValue() as boolean} />
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "bestSocialEngagement",
        header: () => (
          <div className="text-center">
            <div className="font-semibold">Best Social</div>
            <div className="text-xs font-normal opacity-70">Engagement</div>
          </div>
        ),
        cell: info => (
          <div className="flex justify-center">
            <AchievementBadge achieved={info.getValue() as boolean} />
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: "payoutWallet",
        header: "Reward address",
        cell: info => <Address address={info.getValue() as string} />,
        size: 200,
      },
      {
        accessorKey: "totalRewardUSD",
        header: () => <div className="text-right">Total Reward</div>,
        cell: info => <div className="text-right font-bold text-success">${info.getValue() as number}</div>,
        size: 120,
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Claim Reward Banner */}
      {eligibleEntry && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              {/* Left Section - Header */}
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-primary">Congratulations!</h3>
                    <p className="text-base-content/70 text-sm">You're eligible for rewards</p>
                  </div>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[280px]">
                {/* Survey Button */}
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSeGX63Nnd-fh7A_2Zai6UHA_8IP4zRimDhi5-nEeM9i1XbJgw/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-lg bg-white hover:bg-gray-100 text-green-600 border-none shadow-lg gap-3 group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 group-hover:scale-110 transition-transform"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                    />
                  </svg>
                  <span className="font-bold">Complete Survey</span>
                </a>

                {/* Claim Button - Shows different states */}
                {hasClaimed || claimTxHash ? (
                  // Already claimed state
                  <div className="alert alert-success">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-bold">Tokens Claimed! 🎉</p>
                      {claimTxHash && (
                        <a
                          href={`https://blockscout.lisk.com/tx/${claimTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                        >
                          View transaction
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleClaim}
                      disabled={isClaimPending}
                      className="btn btn-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-none shadow-lg gap-3 group disabled:bg-gray-400 disabled:text-gray-600"
                    >
                      {isClaimPending ? (
                        <>
                          <span className="loading loading-spinner loading-md"></span>
                          <span className="font-bold">Claiming...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6 group-hover:scale-110 transition-transform"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                            />
                          </svg>
                          <span className="font-bold">
                            Claim {allocationInLSK} LSK (${eligibleEntry.totalRewardUSD})
                          </span>
                        </>
                      )}
                    </button>

                    {/* Info Text */}
                    <p className="text-xs text-base-content/60 text-center mt-1">
                      Complete the survey first, then claim your reward
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card bg-base-100 shadow-lg overflow-x-auto">
        <div className="card-body p-0">
          <table className="table table-zebra">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className={`${header.column.getCanSort() ? "cursor-pointer select-none hover:bg-base-200" : ""}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-xs">
                            {{
                              asc: "↑",
                              desc: "↓",
                            }[header.column.getIsSorted() as string] ?? "↕"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-base-content/50">
                    No leaderboard data available.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
