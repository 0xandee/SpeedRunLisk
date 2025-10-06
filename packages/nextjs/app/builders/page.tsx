"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useDebounceValue } from "usehooks-ts";
import SearchIcon from "~~/app/_assets/icons/SearchIcon";
import { DateWithTooltip } from "~~/components/DateWithTooltip";
import InfiniteTable from "~~/components/InfiniteTable";
import { Address, InputBase } from "~~/components/scaffold-eth";
import { getSortedUsersWithChallenges } from "~~/services/api/users";
import { UserWithChallengesData } from "~~/services/database/repositories/users";

export default function BuildersPage() {
  const [filter, setFilter] = useState("");

  const [debouncedFilter] = useDebounceValue(filter.length >= 3 ? filter : "", 500);

  const { data: builders, isLoading } = useQuery({
    queryKey: ["builders-count"],
    queryFn: () => getSortedUsersWithChallenges({ start: 0, size: 0, sorting: [] }),
  });

  const tableQueryKey = useMemo(() => ["users", debouncedFilter], [debouncedFilter]);
  const tableInitialSorting = useMemo(() => [{ id: "challengesCompleted", desc: true }], []);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank.toString();
  };

  const columns = useMemo<ColumnDef<UserWithChallengesData>[]>(
    () => [
      {
        header: () => <div className="w-full text-center">Rank</div>,
        accessorKey: "rank",
        enableSorting: false,
        cell: info => {
          const rank = info.getValue() as number;
          return <div className="flex w-full justify-center font-bold text-lg">{getRankDisplay(rank)}</div>;
        },
        size: 100,
      },
      {
        header: "Builder",
        size: 200,
        cell: info => {
          const row = info.row.original;

          return <Address address={row.userAddress} cachedEns={row.ens} cachedEnsAvatar={row.ensAvatar} />;
        },
      },
      {
        header: "Challenges",
        accessorKey: "challengesCompleted",
        cell: info => <div className="flex w-full justify-center">{info.getValue() as string}</div>,
        size: 200,
      },
      {
        header: "Last Activity",
        accessorKey: "lastActivity",
        cell: info => {
          return (
            <div className="flex w-full justify-center">
              <DateWithTooltip timestamp={info.getValue() as Date} position="left" />
            </div>
          );
        },
        size: 300,
      },
    ],
    [],
  );

  const emptyMessage = debouncedFilter
    ? `No builders found matching "${debouncedFilter}". Try a different search term.`
    : "No builders found";

  return (
    <div className="mx-4 text-center">
      <h2 className="mt-10 mb-0 text-3xl">Builders Leaderboard</h2>
      <div className="text-base mt-4">
        List of Lisk builders participating in the SpeedRunLisk Campaign with{" "}
        <Link href="https://github.com/LiskHQ/scaffold-lisk" className="underline">
          Scaffold-Lisk
        </Link>
      </div>

      <div className="text-base mt-4 font-medium flex justify-center gap-1">
        <span>Total Builders:</span>
        {isLoading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <span>{builders?.meta.totalRowCount ?? 0}</span>
        )}
      </div>

      <div className="flex items-center justify-center max-w-md mt-4 mb-8 mx-auto">
        <InputBase
          name="filter"
          value={filter}
          onChange={setFilter}
          placeholder="Search Builders"
          suffix={<SearchIcon className="w-7 h-6 pr-2 fill-primary/60 self-center" />}
        />
      </div>

      <InfiniteTable<UserWithChallengesData>
        columns={columns}
        queryKey={tableQueryKey}
        queryFn={({ start, size, sorting }) =>
          getSortedUsersWithChallenges({
            start,
            size,
            sorting,
            filter: debouncedFilter,
          })
        }
        initialSorting={tableInitialSorting}
        emptyStateMessage={emptyMessage}
      />
    </div>
  );
}
