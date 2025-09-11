"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "../ui/avatar";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { useCurrentUserNameAndEmail } from "@/hooks/use-current-user-name";
import { LogoutButton } from "../logout-button";

const UserButton = () => {
  const userDetails = useCurrentUserNameAndEmail();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <CurrentUserAvatar />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p>{userDetails.name}</p>
          <p>{userDetails.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogoutButton className="w-full" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
