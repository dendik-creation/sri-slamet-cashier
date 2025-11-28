import { PageTitleProps } from "@/Partials/PageTitle";
import { PaginationData, SelectOption } from "./global";
import { AppSetting } from "./app_setting";
import { Customer } from "./customer";
import { User } from "./user";

export type Transaction = {
    id: number;
    invoice_code: string;
    cashier_id: number;
    customer_id: number;
    order_at: string;
    status: "IN_PROGRESS" | "COMPLETED" | "CLOSED";
    subtotal: number;
    tax_ppn: number;
    total: number;
    is_paid: boolean;
    completed_at?: string;

    // relations
    customer: Customer;
    cashier: User;
    items: TransactionItem[];
    payment?: Payment | null;
};

export type TransactionItem = {
    id: number;
    transaction_id: number;
    description: string;
    line_total: number;
    status: "ACTIVE" | "REFUNDED" | "REPLACED" | "COMPLETED";
    refund_reason?: string | null;
};

export type Payment = {
    id: number | undefined;
    transaction_id: number;
    recorded_by: number;
    amount: number | undefined;
    method: string;
    paid_at: string;
    recorder: User;
};

export type CashierTrxNewProps = PageTitleProps & {
    customers: SelectOption[];
    app_setting: AppSetting;
};

export type CashierTrxIndexProps = PageTitleProps & {
    transactions: PaginationData<Transaction>;
    by_search?: string;
    by_status?: string | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
    by_is_paid?: string | "true" | "false";
    cashiers?: SelectOption[];
};

export type CashierTrxShowProps = PageTitleProps & {
    transaction: Transaction;
};

// Financial report types (admin)
export type FinancialReportData = {
    summary: {
        total_revenue: number;
        total_transactions: number;
        average_transaction: number;
        total_outstanding: number;
        total_refunded: number;
        refunded_items_count: number;
        period_days: number;
    };
    breakdown: {
        payment_method: Record<string, number>;
        payment_method_counts: Record<string, number>;
        status_distribution: Record<string, number>;
        status_amount_distribution: Record<string, number>;
    };
    charts: {
        daily_revenue: { labels: string[]; series: number[] };
        daily_transactions: { labels: string[]; series: number[] };
    };
    tables: {
        top_customers: Array<{
            customer: { id: number; name: string };
            total: number;
        }>;
        top_cashiers: Array<{
            user: { id: number; name: string };
            total: number;
        }>;
        transactions: Array<{
            id: number;
            invoice_code: string;
            status: string;
            total: number;
            is_paid: boolean;
            order_at: string;
            completed_at: string | null;
        }>;
    };
};

export type FinancialReportFilters = {
    search: string | null;
    status: string | null;
    start_date_in: string; // order_at range start
    end_date_in: string; // order_at range end
    is_paid: string | null; // "true" | "false" | null (raw request value)
    cashier: string | null; // cashier_id as string
};

export type AdminFinancialReportIndexProps = PageTitleProps & {
    filters: FinancialReportFilters;
    report: FinancialReportData;
    cashiers: SelectOption[];
};

export type AdminFinancialReportPrintProps = PageTitleProps & {
    filters: FinancialReportFilters;
    report: FinancialReportData;
};

export type CashierTrxEditProps = PageTitleProps & {
    transaction: Transaction;
    customers: SelectOption[];
    app_setting: AppSetting;
};
