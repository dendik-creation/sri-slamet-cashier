import {
    DatePickerInput,
    PaginatorBuilder,
    SearchInput,
    SelectSearchInput,
} from "@/components/custom/FormElement";
import {
    floatToIdCurrency,
    humanTrxStatus,
    inputDebounce,
    ymdToIdDate,
} from "@/components/helper/helper";
import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import { CashierTrxIndexProps } from "@/types/transaction";
import { Link, router, useForm } from "@inertiajs/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Printer, Trash2 } from "lucide-react";
import EmptyTable from "@/components/custom/EmptyTable";
import { Badge } from "@/components/ui/badge";
import { SelectOption } from "@/types/global";

const AdminTransactionIndex = ({
    title,
    description,
    transactions,
    by_search,
    by_status,
    cashiers,
}: CashierTrxIndexProps) => {
    const firstRender = useRef(true);
    const { data: filterData, setData: setFilterData } = useForm({
        search: by_search || "",
        status: by_status || "",
        start_date_in: "",
        end_date_in: "",
        is_paid: "",
        cashier: "",
    });

    const handleFilter = (key: keyof typeof filterData, value: string) => {
        setFilterData(key, value);
    };

    const debounceSearch = inputDebounce((data: typeof filterData) => {
        router.get(
            "/admin/transactions",
            {
                search: data.search,
                status: data.status,
                start_date_in: data.start_date_in,
                end_date_in: data.end_date_in,
                is_paid: data.is_paid,
                cashier: data.cashier,
            },
            {
                preserveState: true,
                replace: true,
                only: ["transactions"],
            }
        );
    });

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

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        debounceSearch(filterData);
    }, [filterData]);
    return (
        <AppLayout>
            <PageTitle title={title} description={description} />

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 ">
                <SearchInput
                    placeholder={`Cari kode invoice atau nama pelanggan`}
                    className="w-full"
                    onChange={(e) => handleFilter("search", e.target.value)}
                    value={filterData.search || ""}
                />
                <div className="w-full">
                    <SelectSearchInput
                        className="w-full"
                        placeholder="Pilih Status"
                        value={filterData.status || ""}
                        options={[
                            {
                                label: "Dalam Proses",
                                value: "IN_PROGRESS",
                            },
                            {
                                label: "Selesai",
                                value: "COMPLETED",
                            },
                            {
                                label: "Ditutup / Dibatalkan",
                                value: "CLOSED",
                            },
                        ]}
                        onChange={(value) =>
                            handleFilter("status", value.toString())
                        }
                        removeValue={() => handleFilter("status", "")}
                    />
                </div>
                <div className="w-full">
                    <DatePickerInput
                        className="w-full"
                        mode="range"
                        placeholder="Pilih rentang tanggal transaksi masuk"
                        value={
                            filterData.start_date_in && filterData.end_date_in
                                ? {
                                      from: new Date(filterData.start_date_in),
                                      to: new Date(filterData.end_date_in),
                                  }
                                : undefined
                        }
                        onChange={(dateRange) => {
                            if (dateRange && typeof dateRange === "string") {
                                const [start, end] = dateRange.split(" - ");
                                setFilterData((prev) => ({
                                    ...prev,
                                    start_date_in: start,
                                    end_date_in: end,
                                }));
                            }
                        }}
                    />
                </div>
                <div className="">
                    <SelectSearchInput
                        className="w-full"
                        placeholder="Pilih Status Tagihan"
                        value={filterData.is_paid || ""}
                        options={[
                            {
                                label: "Sudah Lunas",
                                value: "true",
                            },
                            {
                                label: "Belum Lunas",
                                value: "false",
                            },
                        ]}
                        onChange={(value) =>
                            handleFilter("is_paid", value.toString())
                        }
                        removeValue={() => handleFilter("is_paid", "")}
                    />
                </div>
                <div className="">
                    <SelectSearchInput
                        className="w-full"
                        placeholder="Pilih Kasir"
                        value={filterData.cashier || ""}
                        options={cashiers as SelectOption[]}
                        onChange={(value) =>
                            handleFilter("cashier", value.toString())
                        }
                        removeValue={() => handleFilter("cashier", "")}
                    />
                </div>
                <div className="w-full">
                    <Link
                        href={
                            `/admin/transactions/print?` +
                            new URLSearchParams({
                                search: filterData.search || "",
                                status: filterData.status || "",
                                start_date_in: filterData.start_date_in || "",
                                end_date_in: filterData.end_date_in || "",
                                is_paid: filterData.is_paid || "",
                                cashier: filterData.cashier || "",
                            }).toString()
                        }
                    >
                        <Button variant={"yellow"} className="w-full">
                            <Printer />
                            Cetak Laporan
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tables */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-stone-200 font-semibold">
                                #
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Kode Transaksi
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Pelanggan
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Kasir
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Waktu Perbaikan
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Status
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Total Tagihan
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Sisa Tagihan
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.data.map((transaction, index) => (
                            <TableRow key={transaction.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    {transaction.invoice_code}
                                </TableCell>
                                <TableCell>
                                    {transaction.customer.name}
                                </TableCell>
                                <TableCell>
                                    {transaction.cashier.name}
                                </TableCell>
                                <TableCell>
                                    {ymdToIdDate(transaction.order_at)} -{" "}
                                    {ymdToIdDate(transaction.completed_at) ||
                                        "Selesai"}
                                </TableCell>
                                <TableCell>
                                    {buildTrxStatus(transaction.status)}
                                </TableCell>
                                <TableCell>
                                    {floatToIdCurrency(transaction.total)}
                                </TableCell>
                                <TableCell>
                                    {transaction.is_paid ? (
                                        <Badge variant="green">Lunas</Badge>
                                    ) : (
                                        <Badge variant="red">Belum Lunas</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/transactions/${transaction.id}`}
                                        >
                                            <Button
                                                size={"icon"}
                                                variant={"outline"}
                                            >
                                                <Eye />
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {transactions.data.length == 0 && (
                            <EmptyTable
                                colSpan={9}
                                message="Transaksi tidak ada"
                            />
                        )}
                    </TableBody>
                </Table>
            </div>
            {transactions.total > transactions.per_page && (
                <PaginatorBuilder
                    prevUrl={transactions.prev_page_url ?? "#"}
                    nextUrl={transactions.next_page_url ?? "#"}
                    currentPage={transactions.current_page}
                    totalPage={transactions.last_page}
                />
            )}
        </AppLayout>
    );
};

export default AdminTransactionIndex;
