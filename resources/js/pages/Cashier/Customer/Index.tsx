import { SearchInput } from "@/components/custom/FormElement";
import {
    handleElipsisText,
    inputDebounce,
    ymdToIdDate,
} from "@/components/helper/helper";
import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import { AdminCustomerIndexProps } from "@/types/customer";
import { router, useForm } from "@inertiajs/react";
import React, { useEffect, useRef } from "react";
import AdminCustomerCreate from "./ModalCreate";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import ConfirmDialog from "@/components/custom/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import AdminCustomerEdit from "./ModalEdit";
import EmptyTable from "@/components/custom/EmptyTable";

const CashierCustomerIndex = ({
    title,
    description,
    customers,
    search,
}: AdminCustomerIndexProps) => {
    const firstRender = useRef(true);
    const { data: filterData, setData: setFilterData } = useForm({
        search: search || "",
    });

    const handleFilter = (key: keyof typeof filterData, value: string) => {
        setFilterData(key, value);
    };

    const debounceSearch = inputDebounce((data: typeof filterData) => {
        router.get(
            "/cashier/customers",
            {
                search: data.search,
            },
            {
                preserveState: true,
                replace: true,
                only: ["customers"],
            },
        );
    });

    const handleDelete = (id: number) => {
        router.delete(`/cashier/customers/${id}`, {
            preserveScroll: true,
            replace: true,
            only: ["customers"],
        });
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

            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 w-full">
                    <SearchInput
                        placeholder={`Cari nama, no telp, atau alamat pelanggan`}
                        className="lg:max-w-sm w-full"
                        onChange={(e) => handleFilter("search", e.target.value)}
                        value={filterData.search || ""}
                    />
                </div>
                <AdminCustomerCreate />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-stone-200 font-semibold">
                                #
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Nama Lengkap
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Slug
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                No Telepon
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Alamat
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Terdata Sejak
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.data.map((customer, index) => (
                            <TableRow key={customer.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{customer.name}</TableCell>
                                <TableCell>{customer.slug}</TableCell>
                                <TableCell>{customer.phone || "-"}</TableCell>
                                <TableCell>
                                    {handleElipsisText(
                                        customer.address || "",
                                        40,
                                    )}
                                </TableCell>
                                <TableCell>
                                    {ymdToIdDate(customer?.created_at)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <AdminCustomerEdit
                                            customer={customer}
                                        />
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
                                            title="Hapus Pelanggan"
                                            description="Menghapus pelanggan menyebabkan kehilangan riwayat transaksi pelanggan. Apakah anda yakin ?"
                                            type="danger"
                                            confirmAction={() =>
                                                handleDelete(customer.id)
                                            }
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {customers.data.length == 0 && (
                            <EmptyTable
                                colSpan={6}
                                message="Pelanggan tidak ada"
                            />
                        )}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
};

export default CashierCustomerIndex;
