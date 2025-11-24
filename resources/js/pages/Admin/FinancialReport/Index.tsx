import React, { useEffect, useRef } from "react";
import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import DynamicCard from "@/components/custom/DynamicCard";
import { useForm, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import ReactApexChart from "react-apexcharts";
import {
    floatToIdCurrency,
    humanPaymentMethod,
    humanPaymentPlan,
    humanTrxStatus,
    inputDebounce,
    ymdToIdDate,
} from "@/components/helper/helper";
import {
    Calendar,
    Wallet,
    ClipboardList,
    Receipt,
    Printer,
    PieChart,
    TrendingUp,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DatePickerInput,
    SelectSearchInput,
} from "@/components/custom/FormElement";
import EmptyChart from "@/components/custom/EmptyChart";
import EmptyTable from "@/components/custom/EmptyTable";

type FullReportIndexProps = {
    title: string;
    description?: string;
    filters: {
        start_date: string;
        end_date: string;
        status: string | null;
        payment_method: string | null;
        payment_plan: string | null;
    };
    report: {
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
            payment_plan_distribution: Record<string, number>;
            payment_plan_amount_distribution: Record<string, number>;
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
                amount_due: number;
                payment_plan: string | null;
                order_at: string;
                completed_at: string | null;
            }>;
        };
    };
};

const AdminFinancialReportIndex: React.FC<FullReportIndexProps> = ({
    title,
    description,
    filters,
    report,
}) => {
    const { data, setData } = useForm({
        start_date: filters.start_date,
        end_date: filters.end_date,
        status: filters.status || "",
        payment_method: filters.payment_method || "",
        payment_plan: filters.payment_plan || "",
    });
    const prevQueryRef = useRef<string>("");
    const firstRender = useRef(true);

    const buildQuery = () => {
        const params = new URLSearchParams({
            start_date: data.start_date,
            end_date: data.end_date,
            status: data.status,
            payment_method: data.payment_method,
            payment_plan: data.payment_plan,
        });
        return params.toString();
    };

    const debounceFetch = inputDebounce((formData: typeof data) => {
        const params = new URLSearchParams({
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: formData.status,
            payment_method: formData.payment_method,
            payment_plan: formData.payment_plan,
        }).toString();
        if (params !== prevQueryRef.current) {
            prevQueryRef.current = params;
            router.get(
                `/admin/reports/financial?${params}`,
                {},
                { preserveScroll: true, replace: true }
            );
        }
    });

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        debounceFetch(data);
    }, [data]);

    const handleChange = (key: keyof typeof data, value: string) =>
        setData(key, value);

    const revenueOptions: any = {
        chart: { type: "area", toolbar: { show: false } },
        stroke: { curve: "smooth", width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: report.charts.daily_revenue.labels },
        yaxis: { labels: { formatter: (v: number) => floatToIdCurrency(v) } },
        tooltip: { y: { formatter: (v: number) => floatToIdCurrency(v) } },
        colors: ["#FCD34D"],
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 90, 100],
            },
        },
    };
    const revenueSeries = [
        { name: "Pendapatan", data: report.charts.daily_revenue.series },
    ];

    const trxOptions: any = {
        chart: { type: "area", toolbar: { show: false } },
        stroke: { curve: "smooth", width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: report.charts.daily_transactions.labels },
        yaxis: {
            labels: {
                formatter: (v: number) => Math.round(v).toString(),
            },
            decimalsInFloat: 0,
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 90, 100],
            },
        },
        colors: ["#3B82F6"],
    };
    const trxSeries = [
        { name: "Transaksi", data: report.charts.daily_transactions.series },
    ];

    const paymentMethodLabels = Object.keys(
        report.breakdown.payment_method || {}
    );
    const paymentMethodSeries = Object.values(
        report.breakdown.payment_method || {}
    );
    const paymentMethodOptions: any = {
        chart: { type: "donut" },
        labels: paymentMethodLabels.map((method) => humanPaymentMethod(method)),
        legend: { position: "bottom" },
        tooltip: { y: { formatter: (v: number) => floatToIdCurrency(v) } },
    };

    const statusLabels = Object.keys(
        report.breakdown.status_distribution || {}
    );
    const statusSeries = Object.values(
        report.breakdown.status_distribution || {}
    );
    const statusOptions: any = {
        chart: { type: "pie" },
        labels: statusLabels.map((status) => humanTrxStatus(status)),
        legend: { position: "bottom" },
    };

    const planLabels = Object.keys(
        report.breakdown.payment_plan_distribution || {}
    );
    const planSeries = Object.values(
        report.breakdown.payment_plan_distribution || {}
    );
    const planOptions: any = {
        chart: { type: "donut" },
        labels: planLabels.map((plan) => humanPaymentPlan(plan)),
        legend: { position: "bottom" },
    };

    return (
        <AppLayout>
            <PageTitle title={title} description={description} />

            {/* Filters (auto fetch on change) */}
            <form
                onSubmit={(e) => e.preventDefault()}
                className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white rounded-md border"
            >
                <div className="flex flex-col col-span-1">
                    <label className="text-sm font-semibold mb-1">
                        Rentang Tanggal
                    </label>
                    <DatePickerInput
                        className="w-full"
                        mode="range"
                        placeholder="Pilih rentang tanggal"
                        value={
                            data.start_date && data.end_date
                                ? {
                                      from: new Date(data.start_date),
                                      to: new Date(data.end_date),
                                  }
                                : undefined
                        }
                        onChange={(dateRange) => {
                            if (dateRange && typeof dateRange === "string") {
                                const [start, end] = dateRange.split(" - ");
                                setData((prev) => ({
                                    ...prev,
                                    start_date: start,
                                    end_date: end,
                                }));
                            }
                        }}
                    />
                </div>
                <div className="flex flex-col col-span-1">
                    <label className="text-sm font-semibold mb-1">
                        Status Transaksi
                    </label>
                    <SelectSearchInput
                        options={[
                            { label: "Semua", value: "" },
                            { label: "Dalam Proses", value: "IN_PROGRESS" },
                            { label: "Selesai", value: "COMPLETED" },
                            { label: "Ditutup / Dibatalkan", value: "CLOSED" },
                        ]}
                        value={data.status}
                        onChange={(v) => handleChange("status", v as string)}
                        placeholder="Pilih status"
                        removeValue={() => handleChange("status", "")}
                    />
                </div>
                <div className="flex flex-col col-span-1">
                    <label className="text-sm font-semibold mb-1">
                        Metode Pelunasan
                    </label>
                    <SelectSearchInput
                        options={[
                            { label: "Semua", value: "" },
                            { label: "Lunas", value: "FULL_PAID" },
                            { label: "Cicilan", value: "INSTALMENT" },
                        ]}
                        value={data.payment_plan}
                        onChange={(v) =>
                            handleChange("payment_plan", v as string)
                        }
                        placeholder="Metode"
                        removeValue={() => handleChange("payment_plan", "")}
                    />
                </div>
                <div className="flex flex-col col-span-1">
                    <label className="text-sm font-semibold mb-1">
                        Metode Pembayaran Item
                    </label>
                    <SelectSearchInput
                        options={[
                            { label: "Semua", value: "" },
                            { label: "Tunai", value: "CASH" },
                            {
                                label: "Transfer Bank / E-Wallet",
                                value: "TRANSFER",
                            },
                        ]}
                        value={data.payment_method}
                        onChange={(v) =>
                            handleChange("payment_method", v as string)
                        }
                        placeholder="Metode"
                        removeValue={() => handleChange("payment_method", "")}
                    />
                </div>
                <div className="flex items-end gap-2 col-span-2">
                    <Button
                        type="button"
                        variant="yellow"
                        onClick={() => {
                            const q = new URLSearchParams({
                                start_date: data.start_date,
                                end_date: data.end_date,
                                status: data.status || "",
                                payment_method: data.payment_method || "",
                                payment_plan: data.payment_plan || "",
                            }).toString();
                            router.visit(`/admin/reports/financial/print?${q}`);
                        }}
                        className="w-full"
                    >
                        <Printer />
                        <span>Cetak Laporan</span>
                    </Button>
                </div>
            </form>
            {/* KPI Cards (dashboard-like + extra metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <DynamicCard
                    title="Total Pendapatan"
                    value={floatToIdCurrency(report.summary.total_revenue)}
                    icon={<Wallet size={120} className="text-green-200" />}
                    color="green"
                />
                <DynamicCard
                    title="Total Transaksi"
                    value={report.summary.total_transactions}
                    icon={
                        <ClipboardList size={120} className="text-blue-200" />
                    }
                    color="blue"
                />
                <DynamicCard
                    title="Rata-rata / Trx"
                    value={floatToIdCurrency(
                        report.summary.average_transaction
                    )}
                    icon={<Receipt size={120} className="text-yellow-200" />}
                    color="yellow"
                />
                <DynamicCard
                    title="Total Sisa Tagihan"
                    value={floatToIdCurrency(report.summary.total_outstanding)}
                    icon={<Calendar size={120} className="text-red-200" />}
                    color="red"
                />
                <DynamicCard
                    title="Refund (Rp)"
                    value={floatToIdCurrency(report.summary.total_refunded)}
                    icon={<PieChart size={120} className="text-purple-200" />}
                    color="purple"
                />
                <DynamicCard
                    title="Item Refund"
                    value={report.summary.refunded_items_count}
                    icon={<TrendingUp size={120} className="text-purple-200" />}
                    color="purple"
                />
            </div>
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Pendapatan Harian</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan pendapatan harian selama periode laporan
                        </p>
                    </CardHeader>
                    <CardContent>
                        <ReactApexChart
                            options={revenueOptions}
                            series={revenueSeries}
                            type="area"
                            height={320}
                        />
                    </CardContent>
                </Card>
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Transaksi Harian</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan transaksi harian selama periode laporan
                        </p>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-semibold mb-3">Transaksi Harian</h3>
                        <ReactApexChart
                            options={trxOptions}
                            series={trxSeries}
                            type="area"
                            height={320}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Metode Pelunasan</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Variasi metode pelunasan transaksi yang tercatat
                        </p>
                    </CardHeader>
                    <CardContent>
                        {!planSeries.length ? (
                            <EmptyChart type="DONUT" />
                        ) : (
                            <ReactApexChart
                                options={planOptions}
                                series={planSeries}
                                type="donut"
                                height={300}
                            />
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Distribusi Status</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Variasi status transaksi yang tercatat
                        </p>
                    </CardHeader>
                    <CardContent>
                        {!statusSeries.length ? (
                            <EmptyChart type="PIE" />
                        ) : (
                            <ReactApexChart
                                options={statusOptions}
                                series={statusSeries}
                                type="pie"
                                height={300}
                            />
                        )}
                    </CardContent>
                </Card>
                <Card className="">
                    <CardHeader>
                        <CardTitle>Metode Pembayaran Item</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Variasi metode pembayaran yang digunakan untuk
                            melunasi item
                        </p>
                    </CardHeader>
                    <CardContent>
                        {!paymentMethodSeries.length ? (
                            <EmptyChart type="DONUT" />
                        ) : (
                            <ReactApexChart
                                options={paymentMethodOptions}
                                series={paymentMethodSeries}
                                type="donut"
                                height={300}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Top kasir pengelolaan transaksi</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Nilai akumulasi transaksi setiap kasir
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            #
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Nama
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.tables.top_cashiers.length ? (
                                        report.tables.top_cashiers.map(
                                            (row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.user?.name ?? "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {floatToIdCurrency(
                                                            row.total
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )
                                    ) : (
                                        <EmptyTable colSpan={3} />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top Pelanggan</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Nilai akumulasi transaksi setiap pelanggan
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border ">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            #
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Nama
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.tables.top_customers.length ? (
                                        report.tables.top_customers.map(
                                            (row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.customer?.name ??
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {floatToIdCurrency(
                                                            row.total
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )
                                    ) : (
                                        <EmptyTable colSpan={3} />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Transactions Table */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Top 10 transaksi</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Nilai akumulasi total tagihan setiap transaksi
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="bg-stone-200 font-semibold">
                                        #
                                    </TableHead>
                                    <TableHead className="bg-stone-200 font-semibold">
                                        Kode Invoice
                                    </TableHead>
                                    <TableHead className="bg-stone-200 font-semibold">
                                        Status
                                    </TableHead>
                                    <TableHead className="bg-stone-200 font-semibold">
                                        Metode Pelunasan
                                    </TableHead>
                                    <TableHead className="bg-stone-200 font-semibold">
                                        Total
                                    </TableHead>
                                    <TableHead className="bg-stone-200 font-semibold">
                                        Sisa
                                    </TableHead>
                                    <TableHead className="bg-stone-200 font-semibold">
                                        Waktu Perbaikan
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.tables.transactions.length ? (
                                    report.tables.transactions.map((t, idx) => (
                                        <TableRow key={t.id}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>
                                                {t.invoice_code}
                                            </TableCell>
                                            <TableCell>
                                                {humanTrxStatus(t.status)}
                                            </TableCell>
                                            <TableCell>
                                                {humanPaymentPlan(
                                                    t.payment_plan ?? ""
                                                ) || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {floatToIdCurrency(t.total)}
                                            </TableCell>
                                            <TableCell>
                                                {floatToIdCurrency(
                                                    t.amount_due
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {ymdToIdDate(t.order_at)} -{" "}
                                                {ymdToIdDate(t.completed_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <EmptyTable colSpan={7} />
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
};

export default AdminFinancialReportIndex;
