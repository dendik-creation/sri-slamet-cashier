import React, { useEffect } from "react";
import {
    floatToIdCurrency,
    humanTrxStatus,
    humanPaymentPlan,
    humanPaymentMethod,
    ymdToIdDate,
} from "@/components/helper/helper";
import DynamicCard from "@/components/custom/DynamicCard";
import {
    Wallet,
    ClipboardList,
    Receipt,
    Calendar,
    PieChart,
    TrendingUp,
} from "lucide-react";
import { AdminFinancialReportPrintProps } from "@/types/transaction";

const AdminFinancialReportPrint: React.FC<AdminFinancialReportPrintProps> = ({
    title,
    description,
    filters,
    report,
}) => {
    useEffect(() => {
        document.title = title || "Laporan Keuangan";
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
                <p className="text-gray-500">
                    Periode: {ymdToIdDate(filters.start_date)} -{" "}
                    {ymdToIdDate(filters.end_date)}
                </p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 print:gap-2">
                <div className="origin-top-left scale-[0.95] print:scale-[0.9]">
                    <DynamicCard
                        title="Total Pendapatan"
                        value={floatToIdCurrency(report.summary.total_revenue)}
                        icon={<Wallet size={48} className="text-green-200" />}
                        color="green"
                    />
                </div>
                <div className="origin-top-left scale-[0.95] print:scale-[0.9]">
                    <DynamicCard
                        title="Total Transaksi"
                        value={report.summary.total_transactions}
                        icon={
                            <ClipboardList
                                size={48}
                                className="text-blue-200"
                            />
                        }
                        color="blue"
                    />
                </div>
                <div className="origin-top-left scale-[0.95] print:scale-[0.9]">
                    <DynamicCard
                        title="Rata-rata / Trx"
                        value={floatToIdCurrency(
                            report.summary.average_transaction
                        )}
                        icon={<Receipt size={48} className="text-yellow-200" />}
                        color="yellow"
                    />
                </div>
                <div className="origin-top-left scale-[0.95] print:scale-[0.9]">
                    <DynamicCard
                        title="Sisa Tagihan"
                        value={floatToIdCurrency(
                            report.summary.total_outstanding
                        )}
                        icon={<Calendar size={48} className="text-red-200" />}
                        color="red"
                    />
                </div>
                <div className="origin-top-left scale-[0.95] print:scale-[0.9]">
                    <DynamicCard
                        title="Refund (Rp)"
                        value={floatToIdCurrency(report.summary.total_refunded)}
                        icon={
                            <PieChart size={48} className="text-purple-200" />
                        }
                        color="purple"
                    />
                </div>
                <div className="origin-top-left scale-[0.95] print:scale-[0.9]">
                    <DynamicCard
                        title="Item Refund"
                        value={report.summary.refunded_items_count}
                        icon={
                            <TrendingUp size={48} className="text-purple-200" />
                        }
                        color="purple"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
                <div className="border rounded-md p-3 bg-gray-50">
                    <p className="text-[11px] text-gray-500">
                        Rata-rata Pendapatan Harian
                    </p>
                    <p className="font-semibold text-sm">
                        {floatToIdCurrency(
                            Math.round(
                                report.summary.total_revenue /
                                    Math.max(report.summary.period_days, 1)
                            )
                        )}
                    </p>
                </div>
                <div className="border rounded-md p-3 bg-gray-50">
                    <p className="text-[11px] text-gray-500">
                        Rata-rata Transaksi Harian
                    </p>
                    <p className="font-semibold text-sm">
                        {Math.round(
                            report.summary.total_transactions /
                                Math.max(report.summary.period_days, 1)
                        )}
                    </p>
                </div>
            </div>

            <h2 className="text-sm font-semibold mb-2">
                Semua Transaksi Periode
            </h2>
            <table className="w-full border text-[11px] mb-8">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-1">#</th>
                        <th className="p-1">Invoice</th>
                        <th className="p-1">Status</th>
                        <th className="p-1">Waktu Perbaikan</th>
                        <th className="p-1">Metode Pelunasan</th>
                        <th className="p-1">Total</th>
                        <th className="p-1">Sisa</th>
                    </tr>
                </thead>
                <tbody>
                    {report.tables.transactions.length ? (
                        report.tables.transactions.map((t, i) => (
                            <tr
                                key={t.id}
                                className={i % 2 ? "bg-white" : "bg-gray-50"}
                            >
                                <td className="p-1">{i + 1}</td>
                                <td className="p-1">{t.invoice_code}</td>
                                <td className="p-1">
                                    {humanTrxStatus(t.status)}
                                </td>
                                <td className="p-1">
                                    {ymdToIdDate(t.order_at)} -{" "}
                                    {ymdToIdDate(t.completed_at || "")}
                                </td>
                                <td className="p-1">
                                    {humanPaymentPlan(t.payment_plan || "")}
                                </td>
                                <td className="p-1 text-right">
                                    {floatToIdCurrency(t.total)}
                                </td>
                                <td className="p-1 text-right">
                                    {floatToIdCurrency(t.amount_due)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="p-2" colSpan={7}>
                                Tidak ada data
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <footer className="text-[10px] text-gray-500">
                Dicetak pada {ymdToIdDate(new Date().toLocaleString(), true)}
            </footer>
        </div>
    );
};

export default AdminFinancialReportPrint;
