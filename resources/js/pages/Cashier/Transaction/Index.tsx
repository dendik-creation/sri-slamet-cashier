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
import AppLayout, { useInertiaShared } from "@/partials/AppLayout";
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
import ConfirmDialog from "@/components/custom/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import EmptyTable from "@/components/custom/EmptyTable";
import { Badge } from "@/components/ui/badge";

const CashierTransactionIndex = ({
    title,
    description,
    transactions,
    by_search,
    by_status,
    by_order,
}: CashierTrxIndexProps) => {
    const { flash } = useInertiaShared();
    const firstRender = useRef(true);
    const { data: filterData, setData: setFilterData } = useForm({
        search: by_search || "",
        status: by_status || "",
        order: by_order || "",
        by_start_date_in: "",
        by_end_date_in: "",
    });

    const handleFilter = (key: keyof typeof filterData, value: string) => {
        setFilterData(key, value);
    };

    const debounceSearch = inputDebounce((data: typeof filterData) => {
        router.get(
            "/cashier/transactions",
            {
                search: data.search,
                status: data.status,
                order: data.order,
                by_start_date_in: data.by_start_date_in,
                by_end_date_in: data.by_end_date_in,
            },
            {
                preserveState: true,
                replace: true,
                only: ["transactions"],
            }
        );
    });

    const handleDelete = (id: number) => {
        router.delete(`/cashier/transactions/${id}`, {
            preserveScroll: true,
            replace: true,
            only: ["transactions"],
        });
    };

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
            <div className="flex items-center gap-3 mb-4">
                <SearchInput
                    placeholder={`Cari kode invoice atau nama pelanggan`}
                    className="lg:max-w-sm w-full"
                    onChange={(e) => handleFilter("search", e.target.value)}
                    value={filterData.search || ""}
                />
                <div className="">
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
                <div className="">
                    <SelectSearchInput
                        className="w-full"
                        placeholder="Pilih Urutan"
                        value={filterData.order || ""}
                        options={[
                            {
                                label: "Data Terbaru",
                                value: "DESC",
                            },
                            {
                                label: "Data Terlama",
                                value: "ASC",
                            },
                        ]}
                        onChange={(value) =>
                            handleFilter("order", value.toString())
                        }
                        removeValue={() => handleFilter("order", "")}
                    />
                </div>
                <div className="">
                    <DatePickerInput
                        className="w-fit"
                        mode="range"
                        placeholder="Pilih rentang tanggal transaksi masuk"
                        value={
                            filterData.by_start_date_in &&
                            filterData.by_end_date_in
                                ? {
                                      from: new Date(
                                          filterData.by_start_date_in
                                      ),
                                      to: new Date(filterData.by_end_date_in),
                                  }
                                : undefined
                        }
                        onChange={(dateRange) => {
                            if (dateRange && typeof dateRange === "string") {
                                const [start, end] = dateRange.split(" - ");
                                setFilterData((prev) => ({
                                    ...prev,
                                    by_start_date_in: start,
                                    by_end_date_in: end,
                                }));
                            }
                        }}
                    />
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
                                Tgl Masuk
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Tgl Selesai
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
                                    {ymdToIdDate(transaction.order_at)}
                                </TableCell>
                                <TableCell>
                                    {ymdToIdDate(transaction.completed_at) ??
                                        "-"}
                                </TableCell>
                                <TableCell>
                                    {buildTrxStatus(transaction.status)}
                                </TableCell>
                                <TableCell>
                                    {floatToIdCurrency(transaction.total)}
                                </TableCell>
                                <TableCell>
                                    {transaction.amount_due > 0
                                        ? floatToIdCurrency(
                                              transaction.amount_due
                                          )
                                        : "Lunas"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/cashier/transactions/${transaction.id}`}
                                        >
                                            <Button
                                                size={"icon"}
                                                variant={"outline"}
                                            >
                                                <Eye />
                                            </Button>
                                        </Link>
                                        {flash?.user?.id ==
                                            transaction.cashier_id && (
                                            <Link
                                                href={`/cashier/transactions/edit/${transaction.id}`}
                                            >
                                                <Button
                                                    size={"icon"}
                                                    variant={"blue"}
                                                >
                                                    <Pencil />
                                                </Button>
                                            </Link>
                                        )}
                                        {flash?.user?.id ==
                                            transaction.cashier_id && (
                                            <ConfirmDialog
                                                triggerNode={
                                                    <span>
                                                        <Button
                                                            variant={"red"}
                                                            size={"icon"}
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    </span>
                                                }
                                                title="Hapus User"
                                                description="Menghapus user menyebabkan kehilangan akses terhadap sistem. Apakah anda yakin ?"
                                                type="danger"
                                                confirmAction={() =>
                                                    handleDelete(transaction.id)
                                                }
                                            />
                                        )}
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

export default CashierTransactionIndex;
