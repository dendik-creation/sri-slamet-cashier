import EmptyTable from "@/components/custom/EmptyTable";
import {
    floatToIdCurrency,
    humanPaymentMethod,
    humanTrxItemStatus,
    humanTrxStatus,
    ymdToIdDate,
} from "@/components/helper/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import { CashierTrxShowProps } from "@/types/transaction";
import { Link } from "@inertiajs/react";
import { ContactRound, Pencil, ScanBarcode, Wallet } from "lucide-react";
import React from "react";

const CashierTransactionShow = ({
    title,
    description,
    transaction,
}: CashierTrxShowProps) => {
    const buildTrxStatus = (status: string) => {
        const colorByStatus: {
            [key: string]: "blue" | "green" | "red" | "yellow";
        } = {
            IN_PROGRESS: "yellow",
            COMPLETED: "green",
            CLOSED: "red",
        };
        return (
            <Badge variant={colorByStatus[status]}>
                {humanTrxStatus(status)}
            </Badge>
        );
    };
    const buildTrxItemStatus = (status: string) => {
        const colorByStatus: {
            [key: string]: "blue" | "green" | "red" | "yellow";
        } = {
            ACTIVE: "yellow",
            REFUNDED: "red",
            CANCELED: "red",
            COMPLETED: "green",
        };
        return (
            <Badge variant={colorByStatus[status]}>
                {humanTrxItemStatus(status)}
            </Badge>
        );
    };
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-4">
                <PageTitle
                    title={title}
                    description={description}
                    backUrl="/cashier/transactions/records"
                />
                <div className="">
                    <Link href={`/cashier/transactions/edit/${transaction.id}`}>
                        <Button variant={"blue"}>
                            <Pencil />
                            <span>Edit Transaksi</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <div
                className="
                    grid grid-cols-1 md:grid-cols-2 grid-rows-3 md:grid-rows-2
                    gap-4 mb-4
                    w-full
                "
            >
                {/* Card 1: Cust Info */}
                <Card className="py-3 col-start-1 row-start-1">
                    <CardContent className="px-3">
                        <div className="flex items-center gap-3 mb-2">
                            <ContactRound className="text-slate-400" />
                            <h3 className="font-semibold">
                                Informasi Pelanggan
                            </h3>
                        </div>
                        <div className="flex flex-col text-sm gap-2">
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-600">
                                    Nama Pelanggan
                                </span>
                                <span>{transaction.customer.name}</span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-600">
                                    No Telepon
                                </span>
                                <span>{transaction.customer.phone}</span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-600">
                                    Alamat
                                </span>
                                <span>{transaction.customer.address}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Card 2: Trx Payment */}
                <Card className="py-3 col-start-1 row-start-2">
                    <CardContent className="px-3">
                        <div className="flex items-center gap-3 mb-2">
                            <Wallet className="text-slate-400" />
                            <h3 className="font-semibold">Detail Pembayaran</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 text-sm gap-2 mb-4">
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-600">
                                    Status Tagihan
                                </span>
                                <span>
                                    {transaction.is_paid ? (
                                        <Badge variant="green">Lunas</Badge>
                                    ) : (
                                        <Badge variant="red">Belum Lunas</Badge>
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            #
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Metode Pembayaran
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Nominal
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Tanggal Pembayaran
                                        </TableHead>
                                        <TableHead className="bg-stone-200 font-semibold">
                                            Diterima Kasir
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transaction.payment ? (
                                        <TableRow>
                                            <TableCell>1</TableCell>
                                            <TableCell>
                                                {humanPaymentMethod(
                                                    transaction.payment.method,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {floatToIdCurrency(
                                                    transaction.payment
                                                        .amount as number,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {ymdToIdDate(
                                                    transaction.payment.paid_at,
                                                    true,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {
                                                    transaction.payment.recorder
                                                        .name
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <EmptyTable
                                            message="Data pembayaran tidak ada"
                                            colSpan={5}
                                        />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                {/* Card 3: Trx Details */}
                <Card className="py-3 col-start-1 md:col-start-2 row-start-3 md:row-start-1 md:row-span-2">
                    <CardContent className="px-3">
                        <div className="flex items-center gap-3 mb-2">
                            <ScanBarcode className="text-slate-400" />
                            <h3 className="font-semibold">Detail Perbaikan</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-600">
                                    Kode Invoice
                                </span>
                                <span>{transaction.invoice_code}</span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-600">
                                    Waktu Masuk
                                </span>
                                <span>
                                    {ymdToIdDate(transaction.order_at, true)}
                                </span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-600">
                                    Status
                                </span>
                                <span>
                                    {buildTrxStatus(transaction.status)}
                                </span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-600">
                                    Waktu Keluar
                                </span>
                                <span>
                                    {ymdToIdDate(
                                        transaction.completed_at,
                                        true,
                                    ) || "-"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="font-semibold">
                                Permintaan Perbaikan
                            </p>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="bg-stone-200 font-semibold">
                                                #
                                            </TableHead>
                                            <TableHead className="bg-stone-200 font-semibold">
                                                Deskripsi
                                            </TableHead>
                                            <TableHead className="bg-stone-200 font-semibold">
                                                Ongkos Kerja
                                            </TableHead>
                                            <TableHead className="bg-stone-200 font-semibold">
                                                Status
                                            </TableHead>
                                            <TableHead className="bg-stone-200 font-semibold">
                                                Alasan Refund
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transaction.items.length > 0 ? (
                                            transaction.items.map(
                                                (item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.description}
                                                        </TableCell>
                                                        <TableCell>
                                                            {floatToIdCurrency(
                                                                item.line_total,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {buildTrxItemStatus(
                                                                item.status,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.status ===
                                                            "REFUNDED"
                                                                ? item.refund_reason ||
                                                                  "-"
                                                                : "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )
                                        ) : (
                                            <EmptyTable
                                                colSpan={5}
                                                message="Data perbaikan tidak ada"
                                            />
                                        )}
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                align="right"
                                            >
                                                <span className="font-semibold">
                                                    Subtotal
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">
                                                    {floatToIdCurrency(
                                                        transaction.subtotal,
                                                    )}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                align="right"
                                            >
                                                <span className="font-semibold">
                                                    PPN ({transaction.tax_ppn}%)
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">
                                                    {floatToIdCurrency(
                                                        (transaction.subtotal *
                                                            transaction.tax_ppn) /
                                                            100,
                                                    )}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                align="right"
                                            >
                                                <span className="font-semibold">
                                                    Total Tagihan
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">
                                                    {floatToIdCurrency(
                                                        transaction.total,
                                                    )}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default CashierTransactionShow;
