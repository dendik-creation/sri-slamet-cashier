import {
    BanknoteArrowDown,
    BanknoteArrowUp,
    ContactRound,
    Grid2X2,
    LucideProps,
    Receipt,
    ScanBarcode,
    Tickets,
    Users,
} from "lucide-react";
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
        title: "Data Master",
        url: "#",
    },
    {
        type: "item",
        title: "Data User",
        url: "/admin/users",
        icon: Users,
    },
    {
        type: "item",
        title: "Data Pelanggan",
        url: "/admin/customers",
        icon: ContactRound,
    },
    {
        type: "splitter",
        title: "Data Transaksi",
        url: "#",
    },
    {
        type: "item",
        title: "Aktivitas Transaksi",
        url: "/admin/transactions",
        icon: Receipt,
    },
    {
        type: "item",
        title: "Pemasukan",
        url: "/admin/incomes",
        icon: BanknoteArrowUp,
    },
    {
        type: "item",
        title: "Pengeluaran",
        url: "/admin/expenses",
        icon: BanknoteArrowDown,
    },
];

const cashierNavs: NavItems = [
    {
        type: "item",
        title: "Dashboard",
        url: "/cashier/dashboard",
        icon: Grid2X2,
    },
    {
        type: "splitter",
        title: "Data Master",
        url: "#",
    },
    {
        type: "item",
        title: "Data Pelanggan",
        url: "/cashier/customers",
        icon: ContactRound,
    },
    {
        type: "splitter",
        title: "Data Transaksi",
        url: "#",
    },
    {
        type: "item",
        title: "Transaksi Baru",
        url: "/cashier/transactions/new",
        icon: ScanBarcode,
    },
    {
        type: "item",
        title: "Daftar Transaksi",
        url: "/cashier/transactions",
        icon: Tickets,
    },
];

export const sidebarNavs = {
    adminNavs,
    cashierNavs,
};
