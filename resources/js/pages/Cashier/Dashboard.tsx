import React from "react";
import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import DynamicCard from "@/components/custom/DynamicCard";
import { Wallet, TrendingUp, ClipboardList, Receipt } from "lucide-react";
import ReactApexChart from "react-apexcharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    floatToIdCurrency,
    ymdToIdDate,
    humanTrxStatus,
    humanPaymentMethod,
} from "@/components/helper/helper";
import EmptyTable from "@/components/custom/EmptyTable";
import EmptyChart from "@/components/custom/EmptyChart";

type CashierDashboardProps = {
    title: string;
    description?: string;
    kpis: {
        revenue_today: number;
        revenue_month: number;
        trx_today: number;
        outstanding: number;
    };
    charts: {
        revenue7: { labels: string[]; series: number[] };
        paymentMethodMonth: { labels: string[]; series: number[] };
    };
    tables: {
        recentTransactions: Array<{
            id: number;
            invoice_code: string;
            customer: { id: number; name: string } | null;
            status: string;
            total: number;
            amount_due: number;
            order_at: string;
            completed_at: string | null;
        }>;
        recentPayments: Array<{
            id: number;
            transaction: { id: number; invoice_code: string } | null;
            amount: number;
            method: string;
            paid_at: string;
        }>;
    };
};

const CashierDashboard: React.FC<CashierDashboardProps> = ({
    title,
    description,
    kpis,
    charts,
    tables,
}) => {
    const revenue7Options: any = {
        chart: { type: "area", toolbar: { show: false } },
        stroke: { curve: "smooth", width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: charts.revenue7.labels },
        yaxis: { labels: { formatter: (v: number) => floatToIdCurrency(v) } },
        tooltip: { y: { formatter: (v: number) => floatToIdCurrency(v) } },
        colors: ["#3B82F6"],
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.65,
                opacityTo: 0.9,
                stops: [0, 90, 100],
            },
        },
    };
    const revenue7Series = [
        { name: "Pendapatan", data: charts.revenue7.series },
    ];

    const methodOptions: any = {
        chart: { type: "donut" },
        labels: charts.paymentMethodMonth.labels.map((label) =>
            humanPaymentMethod(label)
        ),
        legend: { position: "bottom" },
        tooltip: { y: { formatter: (v: number) => floatToIdCurrency(v) } },
        colors: ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6"],
    };

    return (
        <AppLayout>
            <PageTitle title={title} description={description} />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <DynamicCard
                    title="Pendapatan Hari Ini"
                    value={floatToIdCurrency(kpis.revenue_today)}
                    icon={<Wallet size={120} className="text-green-200" />}
                    color="green"
                />
                <DynamicCard
                    title="Pendapatan Bulan Ini"
                    value={floatToIdCurrency(kpis.revenue_month)}
                    icon={<TrendingUp size={120} className="text-blue-200" />}
                    color="blue"
                />
                <DynamicCard
                    title="Transaksi Hari Ini"
                    value={kpis.trx_today}
                    icon={
                        <ClipboardList size={120} className="text-yellow-200" />
                    }
                    color="yellow"
                />
                <DynamicCard
                    title="Tagihan Tertunda"
                    value={floatToIdCurrency(kpis.outstanding)}
                    icon={<Receipt size={120} className="text-red-200" />}
                    color="red"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pendapatan 7 Hari Terakhir</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan transaksi terbaru (7 Hari) yang tercatat
                        </p>
                    </CardHeader>
                    <CardContent>
                        {revenue7Series.length > 0 ? (
                            <ReactApexChart
                                options={revenue7Options}
                                series={revenue7Series}
                                type="area"
                                height={320}
                            />
                        ) : (
                            <EmptyChart type="AREA" />
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Metode Pembayaran item Bulan Ini</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan metode pembayaran item favorit bulan ini
                        </p>
                    </CardHeader>
                    <CardContent>
                        {charts.paymentMethodMonth.series.length > 0 ? (
                            <ReactApexChart
                                options={methodOptions}
                                series={charts.paymentMethodMonth.series}
                                type="donut"
                                height={320}
                            />
                        ) : (
                            <EmptyChart type="DONUT" />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions & Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaksi Terbaru</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan transaksi terbaru yang tercatat
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
                                            Invoice
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Pelanggan
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Status
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Total
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Sisa
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Masuk
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tables.recentTransactions.length ? (
                                        tables.recentTransactions.map(
                                            (t, idx) => (
                                                <TableRow key={t.id}>
                                                    <TableCell>
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.invoice_code}
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.customer?.name ??
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {humanTrxStatus(
                                                            t.status
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {floatToIdCurrency(
                                                            t.total
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {floatToIdCurrency(
                                                            t.amount_due
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {ymdToIdDate(
                                                            t.order_at
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )
                                    ) : (
                                        <EmptyTable colSpan={7} />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pembayaran Item Terbaru</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan proses pembayaran terbaru yang tercatat
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
                                            Invoice
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Metode
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Nominal
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Tanggal
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tables.recentPayments.length ? (
                                        tables.recentPayments.map((p, idx) => (
                                            <TableRow key={p.id}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>
                                                    {p.transaction
                                                        ?.invoice_code ?? "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {p.method}
                                                </TableCell>
                                                <TableCell>
                                                    {floatToIdCurrency(
                                                        p.amount
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {ymdToIdDate(
                                                        p.paid_at,
                                                        true
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <EmptyTable colSpan={5} />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default CashierDashboard;
