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
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/helper/helper";

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
        chart: { type: "line", toolbar: { show: false } },
        stroke: { curve: "smooth", width: 3 },
        xaxis: { categories: charts.revenue7.labels },
        yaxis: { labels: { formatter: (v: number) => floatToIdCurrency(v) } },
        tooltip: { y: { formatter: (v: number) => floatToIdCurrency(v) } },
    };
    const revenue7Series = [
        { name: "Pendapatan", data: charts.revenue7.series },
    ];

    const methodOptions: any = {
        chart: { type: "donut" },
        labels: charts.paymentMethodMonth.labels,
        legend: { position: "bottom" },
        tooltip: { y: { formatter: (v: number) => floatToIdCurrency(v) } },
    };
    const statusOptions: any = {
        chart: { type: "pie" },
        labels: charts.statusDistribution.labels,
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
                    <CardContent className="p-4 md:p-5">
                        <h3 className="font-semibold mb-3">
                            Pendapatan 7 Hari Terakhir
                        </h3>
                        <ReactApexChart
                            options={revenue7Options}
                            series={revenue7Series}
                            type="line"
                            height={320}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 md:p-5">
                        <h3 className="font-semibold mb-3">
                            Metode Pembayaran (Bulan Ini)
                        </h3>
                        <ReactApexChart
                            options={methodOptions}
                            series={charts.paymentMethodMonth.series}
                            type="donut"
                            height={320}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardContent className="p-4 md:p-5">
                        <h3 className="font-semibold mb-3">
                            Distribusi Status Transaksi
                        </h3>
                        <ReactApexChart
                            options={statusOptions}
                            series={charts.statusDistribution.series}
                            type="pie"
                            height={300}
                        />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardContent className="p-4 md:p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <PieChart className="text-slate-400" />
                            <h3 className="font-semibold">
                                Top Kasir (Bulan Ini)
                            </h3>
                        </div>
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
                                                        row.total
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3}>
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions & Top Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-4 md:p-5">
                        <h3 className="font-semibold mb-3">
                            Transaksi Terbaru
                        </h3>
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
                                        <TableRow>
                                            <TableCell colSpan={7}>
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 md:p-5">
                        <h3 className="font-semibold mb-3">
                            Top Pelanggan (Bulan Ini)
                        </h3>
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
                                                        row.total
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
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
