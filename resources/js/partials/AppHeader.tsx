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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SignoutMenu from "@/components/custom/SignoutMenu";
import { humanRole } from "@/components/helper/helper";
import ChangePasswordModal from "@/components/custom/ChangePasswordModal";
import ProfileUpdateModal from "@/components/custom/ProfileUpdateModal";
interface AppHeaderProps {
    classNames?: string;
    name: string;
    role: "ADMIN" | "CASHIER";
}

const AppHeader: React.FC<AppHeaderProps> = ({ classNames, name, role }) => {
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
                                {humanRole(role)}
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
                        <ProfileUpdateModal />
                        <ChangePasswordModal />
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <SignoutMenu />
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};

export default AppHeader;
