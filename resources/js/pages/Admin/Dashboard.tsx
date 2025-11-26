import React from "react";
import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import DynamicCard from "@/components/custom/DynamicCard";
import {
    Wallet,
    Receipt,
    TrendingUp,
    ClipboardList,
    Users,
    PieChart,
} from "lucide-react";
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

type AdminDashboardProps = {
    title: string;
    description?: string;
    kpis: {
        revenue_today: number;
        revenue_month: number;
        outstanding: number;
        trx_today: number;
        completed_today: number;
    };
    charts: {
        revenue7: { labels: string[]; series: number[] };
        paymentMethodMonth: { labels: string[]; series: number[] };
        statusDistribution: { labels: string[]; series: number[] };
    };
    tables: {
        recentTransactions: Array<{
            id: number;
            invoice_code: string;
            customer: { id: number; name: string } | null;
            cashier: { id: number; name: string } | null;
            status: string;
            total: number;
            amount_due: number;
            order_at: string;
            completed_at: string | null;
        }>;
        topCashiers: Array<{
            user: { id: number; name: string } | null;
            total: number;
        }>;
        topCustomers: Array<{
            customer: { id: number; name: string; phone?: string } | null;
            total: number;
        }>;
    };
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
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
    };
    const revenue7Series = [
        { name: "Pendapatan", data: charts.revenue7.series },
    ];

    const methodOptions: any = {
        chart: { type: "donut" },
        labels: charts.paymentMethodMonth.labels.map((label) =>
            humanPaymentMethod(label),
        ),
        legend: { position: "bottom" },
        tooltip: { y: { formatter: (v: number) => floatToIdCurrency(v) } },
    };
    const statusOptions: any = {
        chart: { type: "pie" },
        labels: charts.statusDistribution.labels.map((label) =>
            humanTrxStatus(label),
        ),
        legend: { position: "bottom" },
    };

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-6 px-1">
                <PageTitle title={title} description={description} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
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
                    title="Tagihan Tertunda"
                    value={floatToIdCurrency(kpis.outstanding)}
                    icon={<Receipt size={120} className="text-red-200" />}
                    color="red"
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
                    title="Selesai Hari Ini"
                    value={kpis.completed_today}
                    icon={<Users size={120} className="text-purple-200" />}
                    color="purple"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Pendapatan 7 Hari Terakhir</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan pendapatan harian selama 7 hari terakhir
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
                        <CardTitle>
                            Metode Pembayaran Item (Bulan Ini)
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan metode pembayaran item favorit selama
                            bulan ini
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribusi Status Transaksi</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Variasi status transaksi yang tercatat
                        </p>
                    </CardHeader>
                    <CardContent>
                        {charts.statusDistribution.series.length > 0 ? (
                            <ReactApexChart
                                options={statusOptions}
                                series={charts.statusDistribution.series}
                                type="pie"
                                height={300}
                            />
                        ) : (
                            <EmptyChart type="PIE" />
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Top Kasir Bulan ini</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Top kasir berdasarkan total transaksi bulan ini
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
                                    {tables.topCashiers.length ? (
                                        tables.topCashiers.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>
                                                    {row.user?.name ?? "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {floatToIdCurrency(
                                                        row.total,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <EmptyTable colSpan={3} />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions & Top Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
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
                                            Waktu Perbaikan
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
                                                            t.status,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {floatToIdCurrency(
                                                            t.total,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {floatToIdCurrency(
                                                            t.amount_due,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {ymdToIdDate(
                                                            t.order_at,
                                                        )}{" "}
                                                        -{" "}
                                                        {t.completed_at
                                                            ? ymdToIdDate(
                                                                  t.completed_at ||
                                                                      "-",
                                                              )
                                                            : "Selesai"}
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )
                                    ) : (
                                        <EmptyTable colSpan={7} />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Top Pelanggan Bulan ini</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Top pelanggan berdasarkan total transaksi bulan ini
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
                                            Nama
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Telepon
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tables.topCustomers.length ? (
                                        tables.topCustomers.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>
                                                    {row.customer?.name ?? "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {row.customer?.phone ?? "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {floatToIdCurrency(
                                                        row.total,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <EmptyTable colSpan={4} />
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
export default AdminDashboard;
