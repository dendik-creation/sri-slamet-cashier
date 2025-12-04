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
            150,
        );
        return () => {
            clearTimeout(printTimeout);
            window.removeEventListener("beforeprint", handleBeforePrint);
            window.removeEventListener("afterprint", handleAfterPrint);
        };
    }, [title]);

    const styles = `
        @media print {
            @page {
                size: A4 landscape;
                margin: 12mm;
            }
            body * {
                visibility: hidden !important;
            }
            #print-area, #print-area * {
                visibility: visible !important;
            }
            #print-area {
                position: absolute !important;
                left: 0;
                top: 0;
                width: 100vw;
                height: auto;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                box-shadow: none !important;
                border: none !important;
            }
        }
    `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div
                id="print-area"
                style={{
                    padding: 24,
                    fontFamily: "Arial, sans-serif",
                    color: "#333",
                    background: "#fff",
                    fontSize: 14,
                    lineHeight: 1.5,
                    maxWidth: 1200,
                    margin: "0 auto",
                }}
            >
                <header
                    style={{
                        marginBottom: 24,
                        borderBottom: "2px solid #333",
                        paddingBottom: 16,
                    }}
                >
                    <h1
                        style={{
                            fontSize: 24,
                            fontWeight: "bold",
                            marginBottom: 8,
                            color: "#333",
                        }}
                    >
                        {title}
                    </h1>
                    {description && (
                        <p
                            style={{
                                color: "#666",
                                fontSize: 14,
                                marginBottom: 12,
                            }}
                        >
                            {description}
                        </p>
                    )}
                    {filters && (
                        <div
                            style={{
                                marginTop: 12,
                                color: "#555",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    marginTop: 8,
                                }}
                            >
                                {(filters.start_date_in ||
                                    filters.end_date_in) && (
                                    <span
                                        style={{
                                            padding: "6px 12px",
                                            background: "#f5f5f5",
                                            border: "1px solid #ddd",
                                            borderRadius: 4,
                                            fontSize: 12,
                                            color: "#333",
                                        }}
                                    >
                                        Periode:{" "}
                                        {ymdToIdDate(
                                            filters.start_date_in || "",
                                        )}{" "}
                                        -{" "}
                                        {ymdToIdDate(filters.end_date_in || "")}
                                    </span>
                                )}
                                {filters.search && (
                                    <span
                                        style={{
                                            padding: "6px 12px",
                                            background: "#f5f5f5",
                                            border: "1px solid #ddd",
                                            borderRadius: 4,
                                            fontSize: 12,
                                            color: "#333",
                                        }}
                                    >
                                        Pencarian: "{filters.search}"
                                    </span>
                                )}
                                {filters.status && (
                                    <span
                                        style={{
                                            padding: "6px 12px",
                                            background: "#f5f5f5",
                                            border: "1px solid #ddd",
                                            borderRadius: 4,
                                            fontSize: 12,
                                            color: "#333",
                                        }}
                                    >
                                        Status Transaksi:{" "}
                                        {humanTrxStatus(String(filters.status))}
                                    </span>
                                )}
                                {filters.is_paid !== undefined &&
                                    filters.is_paid !== null &&
                                    String(filters.is_paid) !== "" && (
                                        <span
                                            style={{
                                                padding: "6px 12px",
                                                background: "#f5f5f5",
                                                border: "1px solid #ddd",
                                                borderRadius: 4,
                                                fontSize: 12,
                                                color: "#333",
                                            }}
                                        >
                                            Tagihan:{" "}
                                            {String(filters.is_paid) ===
                                                "true" ||
                                            filters.is_paid === true
                                                ? "Lunas"
                                                : "Belum Lunas"}
                                        </span>
                                    )}
                                {filters.cashier && (
                                    <span
                                        style={{
                                            padding: "6px 12px",
                                            background: "#f5f5f5",
                                            border: "1px solid #ddd",
                                            borderRadius: 4,
                                            fontSize: 12,
                                            color: "#333",
                                        }}
                                    >
                                        Kasir: {filters.cashier}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: 24,
                        fontSize: 13,
                        background: "#fff",
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{
                                    border: "1px solid #888",
                                    padding: "4px 6px",
                                    background: "#f8f8f8",
                                }}
                            >
                                #
                            </th>
                            <th
                                style={{
                                    border: "1px solid #888",
                                    padding: "4px 6px",
                                    background: "#f8f8f8",
                                }}
                            >
                                Kode Transaksi
                            </th>
                            <th
                                style={{
                                    border: "1px solid #888",
                                    padding: "4px 6px",
                                    background: "#f8f8f8",
                                }}
                            >
                                Pelanggan
                            </th>
                            <th
                                style={{
                                    border: "1px solid #888",
                                    padding: "4px 6px",
                                    background: "#f8f8f8",
                                }}
                            >
                                Kasir
                            </th>
                            <th
                                style={{
                                    border: "1px solid #888",
                                    padding: "4px 6px",
                                    background: "#f8f8f8",
                                }}
                            >
                                Status Transaksi
                            </th>
                            <th
                                style={{
                                    border: "1px solid #888",
                                    padding: "4px 6px",
                                    background: "#f8f8f8",
                                }}
                            >
                                Status Tagihan
                            </th>
                            <th
                                style={{
                                    border: "1px solid #888",
                                    padding: "4px 6px",
                                    background: "#f8f8f8",
                                    textAlign: "right",
                                }}
                            >
                                Total
                            </th>
                            <th
                                style={{
                                    border: "1px solid #888",
                                    padding: "4px 6px",
                                    background: "#f8f8f8",
                                }}
                            >
                                Tanggal Perbaikan
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length ? (
                            transactions.map((t, i) => (
                                <tr key={t.id}>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: 8,
                                            textAlign: "center",
                                        }}
                                    >
                                        {i + 1}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: 8,
                                        }}
                                    >
                                        {t.invoice_code}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: 8,
                                        }}
                                    >
                                        {t.customer?.name ?? "-"}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: 8,
                                        }}
                                    >
                                        {t.cashier?.name ?? "-"}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: 8,
                                        }}
                                    >
                                        {humanTrxStatus(t.status)}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: 8,
                                        }}
                                    >
                                        {t.is_paid ? "Lunas" : "Belum Lunas"}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: 8,
                                            textAlign: "right",
                                        }}
                                    >
                                        {floatToIdCurrency(t.total)}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: 8,
                                        }}
                                    >
                                        {ymdToIdDate(t.order_at, true)}
                                        {t.completed_at
                                            ? ` - ${ymdToIdDate(
                                                  t.completed_at,
                                                  true,
                                              )}`
                                            : ""}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: 8,
                                        textAlign: "center",
                                        color: "#666",
                                        fontStyle: "italic",
                                    }}
                                    colSpan={8}
                                >
                                    Tidak ada data
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default AdminTransactionPrint;
