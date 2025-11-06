import { Grid2X2, LucideProps, Users } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export type NavItems = {
    type: "item" | "splitter";
    title: string;
    url: string;
    icon?: ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
}[];

const adminNavs: NavItems = [
    {
        type: "item",
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: Grid2X2,
    },
    {
        type: "splitter",
        title: "Master Data",
        url: "#",
    },
    {
        type: "item",
        title: "Data User",
        url: "/admin/users",
        icon: Users,
    },
];

const cashierNavs: NavItems = [
    {
        type: "item",
        title: "Dashboard",
        url: "/cashier/dashboard",
        icon: Grid2X2,
    },
];

export const sidebarNavs = {
    adminNavs,
    cashierNavs,
};
