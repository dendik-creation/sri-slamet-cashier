import { PageTitleProps } from "@/Partials/PageTitle";

interface PaginationLink {
    url: string;
    label: string;
    active: boolean;
}

interface PaginationData<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

export interface SelectOption {
    value: string;
    label: string;
    additional_info?: {
        [key: string]: any;
    };
}
