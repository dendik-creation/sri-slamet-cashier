import React from "react";
import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import { AdminAppSettingIndexProps, AppSetting } from "@/types/app_setting";
import { useForm } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorInput } from "@/components/custom/FormElement";
import { cn } from "@/lib/utils";
import { Loader, Save } from "lucide-react";

const AdminAppSettingIndex = ({
    title,
    description,
    app_setting,
}: AdminAppSettingIndexProps) => {
    const {
        data,
        setData,
        put,
        processing,
        errors,
        reset,
        clearErrors,
        setError,
    } = useForm({
        id: app_setting?.id ?? "",
        app_name: app_setting?.app_name ?? "",
        head_address: app_setting?.head_address ?? "",
        branch_address: app_setting?.branch_address ?? "",
        tax_applied: app_setting?.tax_applied?.toString() ?? "0",
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;
        setData(name as keyof AppSetting, value);
    };

    const validateForm = (): boolean => {
        clearErrors();
        let valid = true;

        if (!data.app_name || data.app_name.trim() === "") {
            setError("app_name", "Nama aplikasi wajib diisi");
            valid = false;
        }
        if (!data.head_address || data.head_address.trim() === "") {
            setError("head_address", "Alamat pusat wajib diisi");
            valid = false;
        }
        if (!data.branch_address || data.branch_address.trim() === "") {
            setError("branch_address", "Alamat cabang wajib diisi");
            valid = false;
        }
        const taxVal = Number(data.tax_applied);
        if (
            data.tax_applied === undefined ||
            data.tax_applied === null ||
            data.tax_applied === "" ||
            isNaN(taxVal)
        ) {
            setError("tax_applied", "Persentase pajak wajib diisi");
            valid = false;
        } else if (taxVal < 0 || taxVal > 100) {
            setError("tax_applied", "Persentase pajak harus antara 0 - 100");
            valid = false;
        }
        return valid;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;
        put("/admin/app-setting/update", {
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppLayout>
            <PageTitle title={title} description={description} />
            <form onSubmit={handleSubmit} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col w-full">
                        <label
                            htmlFor="app_name"
                            className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1"
                        >
                            Nama Aplikasi
                        </label>
                        <Input
                            type="text"
                            name="app_name"
                            id="app_name"
                            placeholder="Masukkan nama aplikasi"
                            value={data.app_name ?? ""}
                            onChange={handleChange}
                            className={cn(errors.app_name && "border-red-500")}
                        />
                        {errors.app_name && (
                            <ErrorInput error={errors.app_name} />
                        )}
                    </div>
                    <div className="flex flex-col w-full">
                        <label
                            htmlFor="tax_applied"
                            className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1"
                        >
                            Persentase Pajak (0 - 100)
                        </label>
                        <Input
                            type="number"
                            name="tax_applied"
                            id="tax_applied"
                            min={0}
                            max={100}
                            placeholder="Masukkan persentase pajak"
                            value={data.tax_applied ?? ""}
                            onChange={handleChange}
                            className={cn(
                                errors.tax_applied && "border-red-500",
                            )}
                        />
                        {errors.tax_applied && (
                            <ErrorInput error={errors.tax_applied} />
                        )}
                    </div>
                    <div className="flex flex-col w-full">
                        <label
                            htmlFor="head_address"
                            className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1"
                        >
                            Alamat Pusat
                        </label>
                        <textarea
                            name="head_address"
                            id="head_address"
                            placeholder="Masukkan alamat kantor pusat"
                            value={data.head_address ?? ""}
                            onChange={handleChange}
                            className={cn(
                                "border border-input rounded-md px-3 py-2 text-sm min-h-20 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                errors.head_address && "border-red-500",
                            )}
                        />
                        {errors.head_address && (
                            <ErrorInput error={errors.head_address} />
                        )}
                    </div>
                    <div className="flex flex-col w-full">
                        <label
                            htmlFor="branch_address"
                            className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1"
                        >
                            Alamat Cabang
                        </label>
                        <textarea
                            name="branch_address"
                            id="branch_address"
                            placeholder="Masukkan alamat kantor cabang"
                            value={data.branch_address ?? ""}
                            onChange={handleChange}
                            className={cn(
                                "border border-input rounded-md px-3 py-2 text-sm min-h-20 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                errors.branch_address && "border-red-500",
                            )}
                        />
                        {errors.branch_address && (
                            <ErrorInput error={errors.branch_address} />
                        )}
                    </div>
                </div>
                <Button
                    type="submit"
                    className="w-full mt-6 p-3 bg-green-500 hover:bg-green-600"
                    disabled={processing}
                >
                    {processing ? (
                        <Loader className="animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">
                            <Save />
                            <span>Simpan</span>
                        </span>
                    )}
                </Button>
            </form>
        </AppLayout>
    );
};

export default AdminAppSettingIndex;
