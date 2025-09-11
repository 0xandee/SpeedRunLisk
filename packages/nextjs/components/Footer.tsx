import React from "react";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { BuidlGuidlLogo } from "~~/components/assets/BuidlGuidlLogo";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Site footer
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="flex flex-col md:flex-row gap-2 pointer-events-auto">
            {isLocalNetwork && (
              <>
                <Faucet />
                <Link href="/blockexplorer" passHref className="btn btn-primary btn-sm font-normal gap-1">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span>Block Explorer</span>
                </Link>
              </>
            )}
          </div>
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
      <div className="w-full">
        <div className="flex justify-center items-center gap-2 text-sm">
          {/* <div className="flex items-center gap-2">
            <HeartIcon className="h-4 w-4" />
            <span>Built with</span>
          </div>
          <div className="flex items-center gap-1">
            <BuidlGuidlLogo className="w-3 h-5 pb-px" />
            <span className="font-bold">BuidlGuidl</span>
          </div>
          <span>•</span> */}
          <Link href="https://lisk.com/" target="_blank" rel="noopener noreferrer" className="link">
            Website
          </Link>
          <span>•</span>
          <Link href="https://x.com/lisksea" target="_blank" rel="noopener noreferrer" className="link">
            Twitter
          </Link>
          <span>•</span>
          <Link href="https://lisksea.notion.site/" target="_blank" rel="noopener noreferrer" className="link">
            Notion
          </Link>
          <span>•</span>
          <Link href="https://t.me/LiskSEA" target="_blank" rel="noopener noreferrer" className="link">
            Telegram Group
          </Link>
        </div>
      </div>
    </div>
  );
};
