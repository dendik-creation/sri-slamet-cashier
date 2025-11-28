import React, { useEffect } from "react";
import {
    floatToIdCurrency,
    humanTrxStatus,
    ymdToIdDate,
} from "@/components/helper/helper";

type PrintTransaction = {
    id: number;
    invoice_code: string;
    status: string;
    is_paid: boolean;
    total: number;
    order_at: string;
    completed_at?: string | null;
    customer: { id: number; name: string } | null;
    cashier: { id: number; name: string } | null;
};

type AdminTransactionPrintProps = {
    title: string;
    description?: string;
    transactions: PrintTransaction[];
    filters?: {
        search?: string | null;
        status?: string | null;
        start_date_in?: string | null;
        end_date_in?: string | null;
        is_paid?: string | boolean | null;
        cashier?: string | number | null;
    };
};

const AdminTransactionPrint: React.FC<AdminTransactionPrintProps> = ({
    title,
    description,
    transactions,
    filters,
}) => {
    useEffect(() => {
        document.title = title || "Cetak Laporan Transaksi";

        if (navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
            (function () {
                const realPrintFunc = window.print;
                const interval = 1000;
                let nextAvailableTime = +new Date();
                window.print = function () {
                    const now = +new Date();
                    if (now > nextAvailableTime) {
                        realPrintFunc();
                        nextAvailableTime = now + interval;
                    } else {
                        setTimeout(realPrintFunc, nextAvailableTime - now);
                        nextAvailableTime += interval;
                    }
                };
            })();
        }

        let printStartTime = 0;
        let isProcessingPrint = false;
        let hasNavigatedBack = false;
        const handleBeforePrint = () => {
            printStartTime = Date.now();
            isProcessingPrint = true;
        };
        const handleAfterPrint = () => {
            const duration = Date.now() - printStartTime;
            isProcessingPrint = false;
            if (hasNavigatedBack) return;
            hasNavigatedBack = true;
            if (duration < 500) {
                window.history.back();
            } else {
                setTimeout(() => window.history.back(), 100);
            }
        };
        window.addEventListener("beforeprint", handleBeforePrint);
        window.addEventListener("afterprint", handleAfterPrint);
        const printTimeout = setTimeout(
            () => !isProcessingPrint && window.print(),
            150
        );
        return () => {
            clearTimeout(printTimeout);
            window.removeEventListener("beforeprint", handleBeforePrint);
            window.removeEventListener("afterprint", handleAfterPrint);
        };
    }, [title]);

    return (
        <div className="p-8 print:p-4 font-sans text-xs md:text-sm text-gray-900">
            <header className="mb-6">
                <h1 className="text-2xl font-bold mb-1">{title}</h1>
                {description && <p className="text-gray-600">{description}</p>}
                {filters && (
                    <div className="mt-2 text-gray-500">
                        {(filters.start_date_in || filters.end_date_in) && (
                            <p>
                                Periode:{" "}
                                {ymdToIdDate(filters.start_date_in || "")} -{" "}
                                {ymdToIdDate(filters.end_date_in || "")}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {filters.search ? (
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                    Pencarian: "{filters.search}"
                                </span>
                            ) : null}
                            {filters.status ? (
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                    Status:{" "}
                                    {humanTrxStatus(String(filters.status))}
                                </span>
                            ) : null}
                            {filters.is_paid !== undefined &&
                            filters.is_paid !== null &&
                            String(filters.is_paid) !== "" ? (
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                    Tagihan:{" "}
                                    {String(filters.is_paid) === "true" ||
                                    filters.is_paid === true
                                        ? "Lunas"
                                        : "Belum Lunas"}
                                </span>
                            ) : null}
                            {filters.cashier ? (
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                    Kasir: {filters.cashier}
                                </span>
                            ) : null}
                        </div>
                    </div>
                )}
            </header>

            <table className="w-full border text-[11px] mb-8">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-1 text-left">#</th>
                        <th className="p-1 text-left">Invoice</th>
                        <th className="p-1 text-left">Pelanggan</th>
                        <th className="p-1 text-left">Kasir</th>
                        <th className="p-1 text-left">Status</th>
                        <th className="p-1 text-left">Status Tagihan</th>
                        <th className="p-1 text-right">Total</th>
                        <th className="p-1 text-left">Waktu Perbaikan</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length ? (
                        transactions.map((t, i) => (
                            <tr
                                key={t.id}
                                className={i % 2 ? "bg-white" : "bg-gray-50"}
                            >
                                <td className="p-1">{i + 1}</td>
                                <td className="p-1">{t.invoice_code}</td>
                                <td className="p-1">
                                    {t.customer?.name ?? "-"}
                                </td>
                                <td className="p-1">
                                    {t.cashier?.name ?? "-"}
                                </td>
                                <td className="p-1">
                                    {humanTrxStatus(t.status)}
                                </td>
                                <td className="p-1">
                                    {t.is_paid ? "Lunas" : "Belum Lunas"}
                                </td>
                                <td className="p-1 text-right">
                                    {floatToIdCurrency(t.total)}
                                </td>
                                <td className="p-1">
                                    {ymdToIdDate(t.order_at)}
                                    {t.completed_at
                                        ? ` - ${ymdToIdDate(t.completed_at)}`
                                        : ""}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="p-2" colSpan={8}>
                                Tidak ada data
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AdminTransactionPrint;
