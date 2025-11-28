import React, { useEffect, useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    DatePickerInput,
    ErrorInput,
    SelectSearchInput,
} from "@/components/custom/FormElement";
import { floatToIdCurrency, getNowYmd } from "@/components/helper/helper";
import { Input } from "@/components/ui/input";
import AppLayout, { useInertiaShared } from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Button } from "@/components/ui/button";
import "@splidejs/react-splide/css";
import "@splidejs/react-splide/css/sea-green";
import {
    ChevronLeft,
    ChevronRight,
    ContactRound,
    PlusSquareIcon,
    Save,
    ScanBarcode,
    Trash2,
    Wallet,
} from "lucide-react";
import BlastToaster from "@/components/custom/BlastToaster";
import type { CashierTrxEditProps } from "@/types/transaction";

interface TransactionItemEdit {
    id?: number;
    description: string;
    line_total: number | undefined;
    status: "ACTIVE" | "REFUNDED" | "REPLACED";
    refund_reason?: string | null;
}

const CashierTransactionEdit: React.FC<CashierTrxEditProps> = ({
    title,
    description,
    transaction,
    customers,
    app_setting,
}) => {
    const { flash } = useInertiaShared();

    const initialCustomer = transaction.customer || null;

    const { data, setData, put, processing, errors, setError, clearErrors } =
        useForm({
            trx: {
                invoice_code: transaction.invoice_code || "",
                customer_id: initialCustomer ? String(initialCustomer.id) : "",
                customer_name: initialCustomer ? initialCustomer.name : "",
                customer_phone: initialCustomer ? initialCustomer.phone : "",
                customer_address: initialCustomer
                    ? initialCustomer.address
                    : "",
                order_at: transaction.order_at || "",
                completed_at: transaction.completed_at || getNowYmd(true),
                status: transaction.status || "IN_PROGRESS",
                trx_items: (transaction.items || []).map((it: any) => ({
                    id: it.id,
                    description: it.description,
                    line_total: it.line_total,
                    status: (it.status || "ACTIVE") as
                        | "ACTIVE"
                        | "REFUNDED"
                        | "REPLACED",
                    refund_reason: it?.refund_reason || null,
                })) as TransactionItemEdit[],
                subtotal: transaction.subtotal || 0,
                tax_ppn: app_setting.tax_applied,
                total: transaction.total || 0,
                payment: transaction.payment
                    ? {
                          id: transaction.payment.id,
                          method: transaction.payment.method,
                          amount: transaction.payment.amount,
                      }
                    : { id: undefined, method: "", amount: undefined },
            },
        });

    useEffect(() => {
        const subtotal = data.trx.trx_items.reduce(
            (acc: number, item: TransactionItemEdit) => {
                if (item.status === "REFUNDED") return acc;
                return acc + (item.line_total || 0);
            },
            0
        );
        const total = subtotal + subtotal * (app_setting.tax_applied / 100);
        setData("trx", {
            ...data.trx,
            subtotal,
            tax_ppn: app_setting.tax_applied,
            total,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.trx.trx_items]);

    const handleChangeTrx = (key: keyof typeof data.trx, value: string) => {
        if (key === "customer_id") {
            const selectedCustomer = customers.find(
                (c) => c.value.toString() === value
            );
            if (selectedCustomer) {
                setData("trx", {
                    ...data.trx,
                    customer_id: value,
                    customer_name: selectedCustomer.label,
                    customer_phone:
                        selectedCustomer?.additional_info?.phone ?? "",
                    customer_address:
                        selectedCustomer?.additional_info?.address ?? "",
                });
                return;
            } else {
                setData("trx", {
                    ...data.trx,
                    customer_id: value,
                    customer_name: "",
                    customer_phone: "",
                    customer_address: "",
                });
                return;
            }
        }
        setData("trx", { ...data.trx, [key]: value });
    };

    const handleChangeTrxItem = (
        index: number,
        key: keyof TransactionItemEdit,
        value: string | number | undefined
    ) => {
        const updatedItems = [...data.trx.trx_items];
        updatedItems[index] = { ...updatedItems[index], [key]: value } as any;
        if (key === "status" && value !== "REFUNDED") {
            (updatedItems[index] as TransactionItemEdit).refund_reason = null;
        }
        setData("trx", { ...data.trx, trx_items: updatedItems });
    };

    const handleChangePayment = (
        key: keyof typeof data.trx.payment,
        value: string | number | undefined
    ) => {
        setData("trx", {
            ...data.trx,
            payment: {
                ...data.trx.payment,
                [key]: value,
            },
        });
        if (key == "method" && typeof value === "string") {
            setData("trx", {
                ...data.trx,
                payment: {
                    ...data.trx.payment,
                    method: value as string,
                    amount:
                        value != "CASH" && value != "TRANSFER"
                            ? undefined
                            : data.trx.total,
                },
            });
        }
        if (key == "amount" && typeof value === "number") {
            if (value > data.trx.total) {
                setData("trx", {
                    ...data.trx,
                    payment: {
                        ...data.trx.payment,
                        amount: data.trx.total,
                    },
                });
            }
        }
    };

    const handleAddTrxItem = () => {
        const updatedItems = [...data.trx.trx_items];
        updatedItems.push({
            description: "",
            line_total: undefined,
            status: "ACTIVE",
            refund_reason: null,
        });
        setData("trx", { ...data.trx, trx_items: updatedItems });
    };

    const handleRemoveTrxItem = (index: number) => {
        const updatedItems = data.trx.trx_items.filter(
            (_item: TransactionItemEdit, idx: number) => idx !== index
        );
        setData("trx", { ...data.trx, trx_items: updatedItems });
    };

    const validateForm = (): boolean => {
        clearErrors();
        let isValid = true;

        if (
            !data.trx.customer_id ||
            String(data.trx.customer_id).trim() === ""
        ) {
            setError("trx.customer_id", "Pelanggan wajib dipilih");
            isValid = false;
        }
        if (!data.trx.customer_phone || data.trx.customer_phone.trim() === "") {
            setError("trx.customer_phone", "No Telp wajib diisi");
            isValid = false;
        }
        if (
            !data.trx.customer_address ||
            data.trx.customer_address.trim() === ""
        ) {
            setError("trx.customer_address", "Alamat wajib diisi");
            isValid = false;
        }
        if (!data.trx.invoice_code || data.trx.invoice_code.trim() === "") {
            setError("trx.invoice_code", "Kode Transaksi wajib diisi");
            isValid = false;
        }
        if (!data.trx.order_at || data.trx.order_at.trim() === "") {
            setError("trx.order_at", "Waktu Masuk wajib diisi");
            isValid = false;
        }
        data.trx.trx_items.forEach(
            (item: TransactionItemEdit, index: number) => {
                if (
                    !item.description ||
                    String(item.description).trim() === ""
                ) {
                    (setError as any)(
                        `trx.trx_items.${index}.description`,
                        "wajib diisi"
                    );
                    isValid = false;
                }
                if (item.line_total === undefined || item.line_total === null) {
                    (setError as any)(
                        `trx.trx_items.${index}.line_total`,
                        "wajib diisi"
                    );
                    isValid = false;
                }
                if (item.status === "REFUNDED") {
                    if (
                        !item.refund_reason ||
                        String(item.refund_reason).trim() === ""
                    ) {
                        (setError as any)(
                            `trx.trx_items.${index}.refund_reason`,
                            "Alasan refund wajib"
                        );
                        isValid = false;
                    }
                }
            }
        );

        const paymentMethodFilled =
            !!data.trx.payment.method && data.trx.payment.method !== "";
        const paymentAmountFilled =
            !!data.trx.payment.amount && data.trx.payment.amount !== 0;

        if (paymentMethodFilled || paymentAmountFilled) {
            if (!paymentMethodFilled) {
                (setError as any)(
                    `trx.payment.method`,
                    "Metode pembayaran wajib diisi"
                );
                isValid = false;
            }
            if (!paymentAmountFilled) {
                (setError as any)(
                    `trx.payment.amount`,
                    "Jumlah pembayaran wajib diisi"
                );
                isValid = false;
            }
        }

        return isValid;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            BlastToaster("error", "Lengkapi form terlebih dahulu");
            return;
        }
        put(`/cashier/transactions/update/${transaction.id}`, {
            preserveScroll: true,
            onError: (err: any) => {
                BlastToaster("error", err.toString());
            },
        });
    };

    return (
        <AppLayout>
            <div className="mb-4">
                <PageTitle title={title} description={description} />
            </div>

            <div className="relative">
                {/* Customer Info */}
                <div className="mb-8">
                    <div className="flex my-2 items-center gap-2">
                        <ContactRound className="text-green-500" />
                        <h3 className="text-xl font-semibold">
                            Informasi Pelanggan
                        </h3>
                    </div>
                    <div className="border rounded-md p-4 bg-white/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col">
                                <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                    Nama Pelanggan
                                </label>
                                <SelectSearchInput
                                    options={customers}
                                    value={data.trx.customer_id}
                                    onChange={(value) =>
                                        handleChangeTrx(
                                            "customer_id",
                                            value.toString()
                                        )
                                    }
                                    placeholder="Pilih pelanggan"
                                    removeValue={() =>
                                        handleChangeTrx("customer_id", "")
                                    }
                                />
                                {errors["trx.customer_id"] && (
                                    <ErrorInput
                                        error={errors["trx.customer_id"]}
                                    />
                                )}
                                {errors["trx.customer_name"] && (
                                    <ErrorInput
                                        error={errors["trx.customer_name"]}
                                    />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                    No Telepon
                                </label>
                                <Input
                                    value={data.trx.customer_phone}
                                    disabled={true}
                                    placeholder="Otomatis dari data pelanggan"
                                />
                                {errors["trx.customer_phone"] && (
                                    <ErrorInput
                                        error={errors["trx.customer_phone"]}
                                    />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                    Alamat
                                </label>
                                <textarea
                                    className="border rounded px-3 py-2"
                                    value={data.trx.customer_address}
                                    disabled={true}
                                    placeholder="Otomatis dari data pelanggan"
                                    rows={3}
                                />
                                {errors["trx.customer_address"] && (
                                    <ErrorInput
                                        error={errors["trx.customer_address"]}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="mb-8">
                    <div className="flex my-2 items-center gap-2">
                        <ScanBarcode className="text-green-500" />
                        <h3 className="text-xl font-semibold">
                            Form Transaksi
                        </h3>
                    </div>

                    <div className="border rounded-md p-4 bg-white/50">
                        <h5 className="font-semibold mb-2">Jenis Perbaikan</h5>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="flex flex-col">
                                <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                    Kode Transaksi (INV Code)
                                </label>
                                <Input
                                    value={data.trx.invoice_code}
                                    onChange={(e) =>
                                        handleChangeTrx(
                                            "invoice_code",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Masukkan Kode Transaksi"
                                />
                                {errors["trx.invoice_code"] && (
                                    <ErrorInput
                                        error={errors["trx.invoice_code"]}
                                    />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                    Waktu Masuk (Perbaikan)
                                </label>
                                <DatePickerInput
                                    value={data.trx.order_at}
                                    onChange={(value) =>
                                        handleChangeTrx(
                                            "order_at",
                                            value as string
                                        )
                                    }
                                    mode="single"
                                    placeholder="Pilih Waktu Masuk"
                                    withTime={true}
                                />
                                {errors["trx.order_at"] && (
                                    <ErrorInput
                                        error={errors["trx.order_at"]}
                                    />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label className="text-base mb-1">
                                    Waktu Selesai
                                </label>
                                <DatePickerInput
                                    value={data.trx.completed_at}
                                    onChange={(value) =>
                                        handleChangeTrx(
                                            "completed_at",
                                            value as string
                                        )
                                    }
                                    mode="single"
                                    placeholder="Pilih Waktu Selesai"
                                    withTime={true}
                                />
                                {errors["trx.completed_at"] && (
                                    <ErrorInput
                                        error={errors["trx.completed_at"]}
                                    />
                                )}
                            </div>
                            <div className="flex flex-col col-span-2 mt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-base font-semibold mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                        Permintaan Perbaikan
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={"yellow"}
                                            onClick={handleAddTrxItem}
                                        >
                                            <PlusSquareIcon />
                                            <span>Tambah</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Order Item List */}
                                <div className="flex flex-col">
                                    {data.trx.trx_items.length > 0 &&
                                        data.trx.trx_items.map(
                                            (
                                                item: TransactionItemEdit,
                                                index: number
                                            ) => (
                                                <div
                                                    className="flex items-start gap-3 mb-2"
                                                    key={index}
                                                    style={{
                                                        minHeight: "100px",
                                                    }}
                                                >
                                                    <div className="flex flex-col flex-1 w-full h-full">
                                                        <div className="flex items-start gap-2">
                                                            <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                                                Deskripsi
                                                            </label>
                                                            <div>
                                                                {errors[
                                                                    `trx.trx_items.${index}.description` as any
                                                                ] && (
                                                                    <ErrorInput
                                                                        afterLabel={
                                                                            true
                                                                        }
                                                                        error={
                                                                            "(" +
                                                                            errors[
                                                                                `trx.trx_items.${index}.description` as any
                                                                            ] +
                                                                            ")"
                                                                        }
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <textarea
                                                            rows={3}
                                                            value={
                                                                item.description
                                                            }
                                                            className="w-full rounded-md border px-3 py-2 flex-1 h-full"
                                                            onChange={(e) =>
                                                                handleChangeTrxItem(
                                                                    index,
                                                                    "description",
                                                                    e.target
                                                                        .value as string
                                                                )
                                                            }
                                                            style={{
                                                                height: "100%",
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col w-1/4">
                                                        <div className="flex items-start gap-2">
                                                            <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                                                Ongkos Kerja
                                                            </label>
                                                            <div>
                                                                {(
                                                                    errors as any
                                                                )[
                                                                    `trx.trx_items.${index}.line_total`
                                                                ] && (
                                                                    <ErrorInput
                                                                        afterLabel={
                                                                            true
                                                                        }
                                                                        error={
                                                                            ("(" +
                                                                                (
                                                                                    errors as any
                                                                                )[
                                                                                    `trx.trx_items.${index}.line_total`
                                                                                ] +
                                                                                ")") as any
                                                                        }
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Input
                                                            className="mb-1"
                                                            type="number"
                                                            value={
                                                                item.line_total !==
                                                                undefined
                                                                    ? item.line_total
                                                                    : ""
                                                            }
                                                            onChange={(e) =>
                                                                handleChangeTrxItem(
                                                                    index,
                                                                    "line_total",
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                        />

                                                        {/* Status + Reason */}
                                                        <div className="flex flex-col mt-2">
                                                            <label className="text-base mb-1">
                                                                Status Item
                                                            </label>
                                                            <SelectSearchInput
                                                                options={[
                                                                    {
                                                                        label: "Aktif",
                                                                        value: "ACTIVE",
                                                                    },
                                                                    {
                                                                        label: "Refund",
                                                                        value: "REFUNDED",
                                                                    },
                                                                    {
                                                                        label: "Diganti",
                                                                        value: "REPLACED",
                                                                    },
                                                                ]}
                                                                value={
                                                                    item.status
                                                                }
                                                                onChange={(
                                                                    value
                                                                ) =>
                                                                    handleChangeTrxItem(
                                                                        index,
                                                                        "status",
                                                                        value as any
                                                                    )
                                                                }
                                                                placeholder="Pilih status"
                                                                removeValue={() =>
                                                                    handleChangeTrxItem(
                                                                        index,
                                                                        "status",
                                                                        "ACTIVE"
                                                                    )
                                                                }
                                                            />
                                                            {item.status ===
                                                                "REFUNDED" && (
                                                                <Input
                                                                    className="mt-2"
                                                                    value={
                                                                        item.refund_reason ??
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleChangeTrxItem(
                                                                            index,
                                                                            "refund_reason",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder="Alasan refund"
                                                                />
                                                            )}
                                                            {(errors as any)[
                                                                `trx.trx_items.${index}.refund_reason`
                                                            ] && (
                                                                <ErrorInput
                                                                    error={
                                                                        (
                                                                            errors as any
                                                                        )[
                                                                            `trx.trx_items.${index}.refund_reason`
                                                                        ]
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <Button
                                                            onClick={() =>
                                                                handleRemoveTrxItem(
                                                                    index
                                                                )
                                                            }
                                                            variant={"red"}
                                                            className="mt-3"
                                                        >
                                                            <Trash2 />
                                                            <span>
                                                                Hapus item
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        )}

                                    {data.trx.trx_items.length === 0 && (
                                        <div className="text-gray-500">
                                            tidak ada item perbaikan
                                            ditambahkan.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metode Pembayaran */}
                <div className="mb-8">
                    <div className="flex my-2 items-center gap-2">
                        <Wallet className="text-green-500" />
                        <h3 className="text-xl font-semibold">Pembayaran</h3>
                    </div>

                    <div className="border rounded-md p-4 bg-white/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col">
                                    <label className="text-base mb-1 ">
                                        Metode Pembayaran
                                    </label>
                                    <SelectSearchInput
                                        value={data.trx.payment.method}
                                        onChange={(value) =>
                                            handleChangePayment(
                                                "method",
                                                value.toString()
                                            )
                                        }
                                        options={[
                                            {
                                                value: "CASH",
                                                label: "Tunai",
                                            },
                                            {
                                                value: "TRANSFER",
                                                label: "Transfer Bank / E-Wallet",
                                            },
                                        ]}
                                        placeholder="Pilih Metode Pembayaran"
                                        removeValue={() =>
                                            handleChangePayment("method", "")
                                        }
                                    />
                                    {(errors["trx.payment.method"] as any) && (
                                        <ErrorInput
                                            error={
                                                errors[
                                                    "trx.payment.method"
                                                ] as any
                                            }
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-base mb-1 ">
                                        Nominal Pembayaran
                                    </label>
                                    <Input
                                        type="number"
                                        value={
                                            data.trx.payment.amount !==
                                            undefined
                                                ? data.trx.payment.amount
                                                : ""
                                        }
                                        onChange={(e) =>
                                            handleChangePayment(
                                                "amount",
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : undefined
                                            )
                                        }
                                        placeholder="Masukkan Nominal Pembayaran"
                                    />
                                    {errors["trx.payment.amount"] && (
                                        <ErrorInput
                                            error={errors["trx.payment.amount"]}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end mt-4 w-full">
                                <div className="flex flex-col border rounded-md p-4">
                                    <div className="flex items-center gap-2">
                                        <h6 className="font-semibold w-[120px]">
                                            Kasir
                                        </h6>
                                        <span>{flash?.user?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h6 className="font-semibold w-[120px]">
                                            Subtotal
                                        </h6>
                                        <span>
                                            {floatToIdCurrency(
                                                data.trx.subtotal
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h6 className="font-semibold w-[120px]">
                                            PPN ({app_setting?.tax_applied}
                                            %)
                                        </h6>
                                        <span>
                                            {floatToIdCurrency(
                                                data.trx.subtotal *
                                                    (app_setting.tax_applied /
                                                        100)
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h6 className="font-semibold w-[120px]">
                                            Total
                                        </h6>
                                        <span className="font-bold text-xl">
                                            {floatToIdCurrency(data.trx.total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full">
                <Button
                    variant="yellow"
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={processing}
                >
                    <Save />
                    {data.trx.total <= (data.trx.payment?.amount ?? 0)
                        ? "Selesaikan Transaksi"
                        : "Simpan Transaksi"}
                </Button>
            </div>
        </AppLayout>
    );
};

export default CashierTransactionEdit;
