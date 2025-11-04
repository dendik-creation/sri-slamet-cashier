import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChevronDown, Key, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SignoutMenu from "@/components/custom/SignoutMenu";
interface AppHeaderProps {
    classNames?: string;
    name: string;
    role: "ADMIN" | "CASHIER";
}

const AppHeader: React.FC<AppHeaderProps> = ({ classNames, name, role }) => {
    const humanRole = role === "ADMIN" ? "Administrator" : "Cashier";
    return (
        <header
            className={cn(
                "w-full h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm",
                classNames
            )}
        >
            <div className="flex items-center gap-4">
                <SidebarTrigger />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="flex text-sm flex-col justify-center items-end">
                            <span className="">{name}</span>
                            <span className="text-xs font-semibold">
                                {humanRole}
                            </span>
                        </div>
                        <Avatar className="border-2 border-solid transition-all border-yellow-500">
                            <AvatarImage src="/assets/img/user_icon.png" />
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                        <ChevronDown size={16} />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuGroup>
                        <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
                            <User />
                            Profil Saya
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
                            <Key />
                            Ubah Password
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <SignoutMenu />
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};

export default AppHeader;
