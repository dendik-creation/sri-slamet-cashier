import {
    DatePickerInput,
    ErrorInput,
    SelectSearchInput,
} from "@/components/custom/FormElement";
import { floatToIdCurrency } from "@/components/helper/helper";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import AppLayout, { useInertiaShared } from "@/partials/AppLayout";
import { PageTitle, PageTitleProps } from "@/Partials/PageTitle";
import { AppSetting } from "@/types/app_setting";
import { SelectOption } from "@/types/global";
import { useForm } from "@inertiajs/react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import React, { useEffect, useState } from "react";
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
import { CashierTrxNewProps } from "@/types/transaction";

const CashierTransactionNew = ({
    title,
    description,
    customers,
    app_setting,
}: CashierTrxNewProps) => {
    const { flash } = useInertiaShared();
    const [splideIndex, setSplideIndex] = useState(0);
    const splideRef = React.useRef<any>(null);
    const {
        data,
        setData,
        post,
        processing,
        errors,
        setError,
        clearErrors,
        reset,
    } = useForm({
        is_new_customer: false,
        trx: {
            invoice_code: "BM-02.",
            customer_id: "",
            customer_name: "",
            customer_phone: "",
            customer_address: "",
            order_at: "",
            payment_plan: "",
            payment_amount: undefined,
            trx_items: [
                {
                    description: "",
                    line_total: undefined,
                },
            ],
            subtotal: 0,
            tax_ppn: 0,
            total: 0,
            notes: "",
            payments: [
                {
                    payment_method: "",
                    amount: undefined,
                },
            ],
        },
    });

    useEffect(() => {
        if (splideRef.current && splideRef.current.index !== splideIndex) {
            splideRef.current.go(splideIndex);
        }
    }, [splideIndex]);

    useEffect(() => {
        const subtotal = data.trx.trx_items.reduce((acc, item) => {
            return acc + (item.line_total || 0);
        }, 0);
        const total = subtotal + subtotal * (app_setting.tax_applied / 100);
        setData("trx", {
            ...data.trx,
            subtotal,
            tax_ppn: app_setting.tax_applied,
            total,
        });
    }, [data.trx.trx_items]);

    const handleCustomerType = (value: boolean) => {
        reset();
        clearErrors();
        setData("is_new_customer", value);
    };

    const navigateSlide = (index: number) => {
        if (splideRef.current) {
            splideRef.current.go(index);
        }
    };
    const scrollToDown = () => {
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
            });
        }, 250);
    };

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
        setData("trx", {
            ...data.trx,
            [key]: value,
        });
    };

    const handleChangeTrxItem = (
        index: number,
        key: keyof (typeof data.trx.trx_items)[0],
        value: string | number | undefined
    ) => {
        const updatedItems = [...data.trx.trx_items];
        updatedItems[index] = {
            ...updatedItems[index],
            [key]: value,
        };
        setData("trx", {
            ...data.trx,
            trx_items: updatedItems,
        });
    };

    const handleChangePayment = (
        index: number,
        key: keyof (typeof data.trx.payments)[0],
        value: string | number | undefined
    ) => {
        const updatedPayments = [...(data.trx.payments || [])];
        updatedPayments[index] = {
            ...updatedPayments[index],
            [key]: value,
        };
        setData("trx", {
            ...data.trx,
            payments: updatedPayments,
        });
    };

    const handleAddTrxItem = () => {
        const updatedItems = [...data.trx.trx_items];
        updatedItems.push({
            description: "",
            line_total: undefined,
        });
        setData("trx", {
            ...data.trx,
            trx_items: updatedItems,
        });
        scrollToDown();
    };

    const handleRemoveTrxItem = (index: number) => {
        const updatedItems = data.trx.trx_items.filter(
            (_item, idx) => idx !== index
        );
        setData("trx", {
            ...data.trx,
            trx_items: updatedItems,
        });
    };

    const handleAddPayment = () => {
        const updatedPayments = [...(data.trx.payments || [])];
        updatedPayments.push({ payment_method: "", amount: undefined });
        setData("trx", {
            ...data.trx,
            payments: updatedPayments,
        });
        scrollToDown();
    };

    const handleRemovePayment = (index: number) => {
        const updatedPayments = (data.trx.payments || []).filter(
            (_payment, idx) => idx !== index
        );
        setData("trx", {
            ...data.trx,
            payments: updatedPayments,
        });
    };

    const validateForm = (): boolean => {
        let isValid = true;
        let hasCustomerError = false;
        let hasTrxFormError = false;
        clearErrors();

        if (!data.is_new_customer) {
            if (!data.trx.customer_id || data.trx.customer_id.trim() === "") {
                setError("trx.customer_id", "Pelanggan wajib dipilih");
                isValid = false;
                hasCustomerError = true;
            }
        } else {
            if (
                !data.trx.customer_name ||
                data.trx.customer_name.trim() === ""
            ) {
                setError("trx.customer_name", "Nama Pelanggan wajib diisi");
                isValid = false;
                hasCustomerError = true;
            }
        }
        if (!data.trx.customer_phone || data.trx.customer_phone.trim() === "") {
            setError("trx.customer_phone", "No Telp wajib diisi");
            isValid = false;
            hasCustomerError = true;
        }
        if (
            !data.trx.customer_address ||
            data.trx.customer_address.trim() === ""
        ) {
            setError("trx.customer_address", "Alamat wajib diisi");
            isValid = false;
            hasCustomerError = true;
        }
        if (!data.trx.invoice_code || data.trx.invoice_code.trim() === "") {
            setError("trx.invoice_code", "Kode Transaksi wajib diisi");
            isValid = false;
            hasTrxFormError = true;
        }
        if (!data.trx.order_at || data.trx.order_at.trim() === "") {
            setError("trx.order_at", "Waktu Masuk wajib diisi");
            isValid = false;
            hasTrxFormError = true;
        }

        // Each trx item validation
        data.trx.trx_items.forEach((item, index) => {
            if (!item.description || item.description.trim() === "") {
                setError(`trx.trx_items.${index}.description`, "wajib diisi");
                isValid = false;
                hasTrxFormError = true;
            }
            if (item.line_total === undefined || item.line_total === null) {
                setError(`trx.trx_items.${index}.line_total`, "wajib diisi");
                isValid = false;
                hasTrxFormError = true;
            }
        });
        if (hasCustomerError) {
            setSplideIndex(0);
        } else if (hasTrxFormError) {
            setSplideIndex(1);
        }
        return isValid;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            BlastToaster("error", "Lengkapi form terlebih dahulu");
            return;
        }
        post("/cashier/transactions/new", {
            replace: true,
            preserveScroll: true,
            onError: (err) => {
                console.log(err);
                BlastToaster("error", err.toString());
            },
        });
    };

    return (
        <AppLayout>
            <div className="mb-4">
                <PageTitle title={title} description={description} />
            </div>

            <div className="flex justify-between items-center">
                <div className="mb-3 flex items-center gap-2">
                    <Switch
                        checked={data.is_new_customer}
                        onCheckedChange={(checked) =>
                            handleCustomerType(checked)
                        }
                    />
                    <span>Untuk Pelanggan Baru</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigateSlide(splideIndex - 1)}
                        disabled={splideIndex === 0}
                    >
                        <ChevronLeft />
                        Kembali
                    </Button>
                    {splideIndex < 2 ? (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigateSlide(splideIndex + 1)}
                        >
                            <ChevronRight />
                            Berikutnya
                        </Button>
                    ) : (
                        <Button
                            variant="yellow"
                            size="lg"
                            onClick={handleSubmit}
                            disabled={processing}
                        >
                            <Save />
                            Simpan Transaksi
                        </Button>
                    )}
                </div>
            </div>

            <div className="relative">
                <style>{`.splide__track { padding: 0 !important; }`}</style>
                <Splide
                    tag="section"
                    ref={splideRef}
                    options={{
                        pagination: false,
                        arrows: false,
                        padding: 0,
                        gap: "2rem",
                    }}
                    className="p-0!"
                    onMove={(_splide, newIndex) => setSplideIndex(newIndex)}
                    onMounted={(_splide) => setSplideIndex(_splide.index)}
                >
                    {/* Customer Info */}
                    <SplideSlide>
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
                                    {data.is_new_customer ? (
                                        <Input
                                            value={data.trx.customer_name}
                                            onChange={(e) =>
                                                handleChangeTrx(
                                                    "customer_name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Masukkan nama pelanggan"
                                        />
                                    ) : (
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
                                                handleChangeTrx(
                                                    "customer_id",
                                                    ""
                                                )
                                            }
                                        />
                                    )}
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
                                        onChange={(e) =>
                                            handleChangeTrx(
                                                "customer_phone",
                                                e.target.value
                                            )
                                        }
                                        disabled={!data.is_new_customer}
                                        placeholder={
                                            data.is_new_customer
                                                ? "Masukkan no telepon"
                                                : "Otomatis dari data pelanggan"
                                        }
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
                                        onChange={(e) =>
                                            handleChangeTrx(
                                                "customer_address",
                                                e.target.value
                                            )
                                        }
                                        disabled={!data.is_new_customer}
                                        placeholder={
                                            data.is_new_customer
                                                ? "Masukkan alamat"
                                                : "Otomatis dari data pelanggan"
                                        }
                                        rows={3}
                                    />
                                    {errors["trx.customer_address"] && (
                                        <ErrorInput
                                            error={
                                                errors["trx.customer_address"]
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </SplideSlide>
                    {/* Transaction Details */}
                    <SplideSlide>
                        <div className="flex my-2 items-center gap-2">
                            <ScanBarcode className="text-green-500" />
                            <h3 className="text-xl font-semibold">
                                Form Transaksi
                            </h3>
                        </div>

                        <div className="border rounded-md p-4 bg-white/50">
                            <h5 className="font-semibold mb-2">
                                Jenis Perbaikan{" "}
                                <span>
                                    {data.is_new_customer
                                        ? "Untuk Baru"
                                        : "Untuk Langganan"}
                                </span>
                            </h5>
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
                                        {data.trx.trx_items.length &&
                                            data.trx.trx_items.map(
                                                (item, index) => (
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
                                                                        `trx.trx_items.${index}.description` as const
                                                                    ] && (
                                                                        <ErrorInput
                                                                            afterLabel={
                                                                                true
                                                                            }
                                                                            error={
                                                                                "(" +
                                                                                errors[
                                                                                    `trx.trx_items.${index}.description` as const
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
                                                                    {errors[
                                                                        `trx.trx_items.${index}.line_total` as const
                                                                    ] && (
                                                                        <ErrorInput
                                                                            afterLabel={
                                                                                true
                                                                            }
                                                                            error={
                                                                                "(" +
                                                                                errors[
                                                                                    `trx.trx_items.${index}.line_total` as const
                                                                                ] +
                                                                                ")"
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Input
                                                                className="mb-3"
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
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                            />
                                                            {index > 0 && (
                                                                <Button
                                                                    onClick={() =>
                                                                        handleRemoveTrxItem(
                                                                            index
                                                                        )
                                                                    }
                                                                    variant={
                                                                        "red"
                                                                    }
                                                                >
                                                                    <Trash2 />
                                                                    <span>
                                                                        Hapus
                                                                        item
                                                                    </span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SplideSlide>
                    {/* Metode Pembayaran */}
                    <SplideSlide>
                        <div className="flex my-2 items-center gap-2">
                            <Wallet className="text-green-500" />
                            <h3 className="text-xl font-semibold">
                                Pembayaran (Opsional)
                            </h3>
                        </div>

                        <div className="border rounded-md p-4 bg-white/50">
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="text-base mb-1 ">
                                        Metode Pelunasan
                                    </label>
                                    <SelectSearchInput
                                        value={data.trx.payment_plan}
                                        onChange={(value) =>
                                            handleChangeTrx(
                                                "payment_plan",
                                                value.toString()
                                            )
                                        }
                                        options={[
                                            {
                                                value: "FULL_PAID",
                                                label: "Langsung Lunas",
                                            },
                                            {
                                                value: "INSTALMENT",
                                                label: "Cicilan / Bertahap",
                                            },
                                        ]}
                                        placeholder="Pilih Metode Pelunasan"
                                        removeValue={() =>
                                            handleChangeTrx("payment_plan", "")
                                        }
                                    />
                                    {errors["trx.payment_plan"] && (
                                        <ErrorInput
                                            error={errors["trx.payment_plan"]}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-col col-span-2 mt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-base font-semibold mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                            Detail Pembayaran
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={"yellow"}
                                                onClick={handleAddPayment}
                                            >
                                                <PlusSquareIcon />
                                                <span>Tambah</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {data.trx.payments?.map(
                                            (payment, idx) => (
                                                <div
                                                    className="flex items-start gap-2"
                                                    key={idx}
                                                >
                                                    <div className="flex flex-col w-full">
                                                        <label className="text-base mb-1">
                                                            Metode Pembayaran
                                                        </label>
                                                        <SelectSearchInput
                                                            options={[
                                                                {
                                                                    label: "Tunai",
                                                                    value: "CASH",
                                                                },
                                                                {
                                                                    label: "Transfer Bank / E-Wallet",
                                                                    value: "TRANSFER",
                                                                },
                                                            ]}
                                                            value={
                                                                payment.payment_method
                                                            }
                                                            onChange={(value) =>
                                                                handleChangePayment(
                                                                    idx,
                                                                    "payment_method",
                                                                    value.toString()
                                                                )
                                                            }
                                                            placeholder="Pilih Metode Pembayaran"
                                                            removeValue={() =>
                                                                handleChangePayment(
                                                                    idx,
                                                                    "payment_method",
                                                                    ""
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex flex-col w-full">
                                                        <label className="text-base mb-1">
                                                            Nominal Pembayaran
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            value={
                                                                payment.amount
                                                            }
                                                            onChange={(e) =>
                                                                handleChangePayment(
                                                                    idx,
                                                                    "amount",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Masukkan Nominal Pembayaran"
                                                        />
                                                    </div>
                                                    {idx > 0 && (
                                                        <div className="h-full flex items-end">
                                                            <Button
                                                                variant={"red"}
                                                                onClick={() =>
                                                                    handleRemovePayment(
                                                                        idx
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 />
                                                                <span>
                                                                    Hapus item
                                                                </span>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end mt-4">
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
                                                    PPN (
                                                    {app_setting?.tax_applied}%)
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
                                                    {floatToIdCurrency(
                                                        data.trx.total
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SplideSlide>
                </Splide>
            </div>
        </AppLayout>
    );
};

export default CashierTransactionNew;
