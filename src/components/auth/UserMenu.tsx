"use client";

import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearDatasetCache, clearRuntimeStateCache } from "@/lib/dal";

export function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return null;

  function handleSignOut() {
    clearDatasetCache();
    clearRuntimeStateCache();
    void signOut({ redirectTo: "/" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 px-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
            {user.name?.slice(0, 1) ?? "회"}
          </span>
          <span className="hidden max-w-24 truncate sm:inline">
            {user.name}
          </span>
          <ChevronDown className="size-3.5 text-guud-text-muted-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="space-y-1">
          <span className="block text-sm font-semibold text-foreground">
            {user.name}
          </span>
          <span className="block font-normal">{user.role} 계정</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/home">
            <LayoutDashboard />
            서비스 홈
          </Link>
        </DropdownMenuItem>
        {user.role !== "운영자" && (
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserRound />내 프로필
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
