import { PageTitleProps } from "@/Partials/PageTitle";
import { PaginationData } from "./global";

export type Customer = {
    id: number;
    name: string;
    phone?: string;
    address: string;
    slug: string;
    created_at?: string;
    updated_at?: string;
};

export type AdminCustomerIndexProps = PageTitleProps & {
    customers: PaginationData<Customer>;
    search: string;
};
