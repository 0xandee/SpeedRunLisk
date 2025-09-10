"use client";

import { useRef } from "react";
import { CopyValueToClipboard } from "../../../../components/CopyValueToClipboard";
import { UpdateSocialsModal } from "./UpdateSocialsModal";
import { useAccount } from "wagmi";
import QuestionIcon from "~~/app/_assets/icons/QuestionIcon";
import { UserByAddress } from "~~/services/database/repositories/users";
import { getUserSocials, getUserSocialsList } from "~~/utils/socials";

export const UserSocials = ({ user }: { user: NonNullable<UserByAddress> }) => {
  const { address } = useAccount();
  const modalRef = useRef<HTMLDialogElement>(null);
  const isProfileOwner = address?.toLowerCase() === user.userAddress.toLowerCase();

  const userSocials = getUserSocialsList(user);

  if (!userSocials.length && !isProfileOwner) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {userSocials.length > 0 ? (
        <div className="flex flex-wrap gap-[20px] justify-center">
          {userSocials
            .filter(social => social.value)
            .map(social => {
              const link = social.getLink?.(social.value as string);
              return (
                <div key={social.key} className="flex items-center">
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="link">
                      <social.icon className="w-6 h-6" />
                    </a>
                  ) : (
                    <CopyValueToClipboard text={social.value as string} Icon={social.icon} />
                  )}
                </div>
              );
            })}
        </div>
      ) : isProfileOwner ? (
        <></>
      ) : null}

      {isProfileOwner && (
        <button onClick={() => modalRef.current?.showModal()} className="btn btn-xs btn-outline">
          Update Socials
        </button>
      )}

      <UpdateSocialsModal
        ref={modalRef}
        closeModal={() => modalRef.current?.close()}
        existingSocials={getUserSocials(user)}
      />
    </div>
  );
};
