import { PageTitleProps } from "@/Partials/PageTitle";
import { PaginationData } from "./global";

export type User = {
    id: number;
    username: string;
    name: string;
    role: "ADMIN" | "CASHIER";
    created_at: string;
    updated_at: string;
};

export type AdminUserIndexProps = PageTitleProps & {
    users: PaginationData<User>;
    search?: string;
    role?: "ADMIN" | "CASHIER";
};
