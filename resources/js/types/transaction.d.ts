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
    amount_due: number;
    payment_plan?: "FULL_PAID" | "INSTALMENT";
    completed_at?: string;
    notes?: string;

    // relations
    customer: Customer;
    cashier: User;
    items: TransactionItem[];
    payments: Payment[];
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
    id: number;
    transaction_id: number;
    recorded_by: number;
    amount: number;
    method: "CASH" | "TRANSFER";
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
    by_order?: "ASC" | "DESC";
};

export type CashierTrxShowProps = PageTitleProps & {
    transaction: Transaction;
};

export type CashierTrxEditProps = PageTitleProps & {
    transaction: Transaction;
    customers: SelectOption[];
    app_setting: AppSetting;
};
