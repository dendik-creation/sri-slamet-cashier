import { LogOut } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import ConfirmDialog from "./ConfirmDialog";
import { router } from "@inertiajs/react";

const SignoutNavItem = () => {
    const handleSignOut = async () => {
        router.post("/auth/signout", {}, { preserveScroll: true });
    };
    return (
        <ConfirmDialog
            triggerNode={
                <SidebarMenuItem
                    className={`text-white/80 font-bold mt-4 transition-all w-full`}
                    key={"sign-out"}
                >
                    <SidebarMenuButton
                        className="transition-all cursor-pointer active:bg-red-800 bg-red-600 hover:bg-red-700"
                        asChild
                    >
                        <div className="flex items-center gap-2">
                            <LogOut />
                            <span>Log Out</span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            }
            title="Log Out"
            type="danger"
            description="Jika Anda keluar, Anda harus login kembali untuk mengakses aplikasi ini."
            confirmAction={handleSignOut}
        />
    );
};

export default SignoutNavItem;
