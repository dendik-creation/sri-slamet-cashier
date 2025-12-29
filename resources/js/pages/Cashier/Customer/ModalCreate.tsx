import { useForm } from "@inertiajs/react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CircleFadingPlus, CircleX, Loader, Save } from "lucide-react";
import { ErrorInput } from "@/components/custom/FormElement";

const CashierCustomerCreate = () => {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        setError,
        clearErrors,
    } = useForm({
        name: "",
        phone: "",
        address: "",
    });
    const handleChangeInput = (key: keyof typeof data, value: string) => {
        setData(key, value);
    };
    const validateForm = (): boolean => {
        let isValid = true;
        clearErrors();
        if (!data.name || data.name.trim() === "") {
            setError("name", "Nama Lengkap wajib diisi");
            isValid = false;
        }
        if (!data.address || data.address.trim() === "") {
            setError("address", "Alamat wajib diisi");
            isValid = false;
        }
        return isValid;
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        post("/cashier/customers", {
            replace: true,
            preserveState: true,
            only: ["customers"],
            onSuccess: () => reset(),
        });
    };
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={"yellow"}>
                    <CircleFadingPlus />
                    <span>Tambah Pelanggan</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-7xl">
                <DialogHeader>
                    <DialogTitle>Tambah Pelanggan</DialogTitle>
                    <DialogDescription className="mb-3">
                        Silakan isi data pelanggan baru
                    </DialogDescription>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="flex flex-col w-full">
                            <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                Nama Lengkap
                            </label>
                            <Input
                                type="text"
                                placeholder="Masukkan Nama Lengkap"
                                className="w-full"
                                disabled={processing}
                                value={data.name || ""}
                                onChange={(e) =>
                                    handleChangeInput("name", e.target.value)
                                }
                            />
                            {errors.name && <ErrorInput error={errors.name} />}
                        </div>
                        <div className="flex flex-col w-full">
                            <label className="text-base mb-1">No Telepon</label>
                            <Input
                                type="text"
                                placeholder="Masukkan No Telepon"
                                className="w-full"
                                disabled={processing}
                                value={data.phone || ""}
                                onChange={(e) =>
                                    handleChangeInput("phone", e.target.value)
                                }
                            />
                            {errors.phone && (
                                <ErrorInput error={errors.phone} />
                            )}
                        </div>
                        <div className="flex flex-col w-full">
                            <label className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1">
                                Alamat
                            </label>
                            <textarea
                                placeholder="Masukkan Alamat"
                                className="w-full rounded-md border px-3 py-2"
                                disabled={processing}
                                value={data.address || ""}
                                onChange={(e) =>
                                    handleChangeInput("address", e.target.value)
                                }
                            />
                            {errors.address && (
                                <ErrorInput error={errors.address} />
                            )}
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="mt-9">
                    <DialogClose asChild disabled={processing}>
                        <Button
                            variant="red"
                            disabled={processing}
                            className="flex items-center gap-2"
                        >
                            <CircleX /> Batalkan
                        </Button>
                    </DialogClose>
                    <Button
                        variant="yellow"
                        disabled={processing}
                        onClick={handleSubmit}
                        className="flex items-center gap-2"
                    >
                        {processing ? (
                            <Loader />
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save /> Simpan
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CashierCustomerCreate;
