import { ErrorInput, SelectSearchInput } from "@/components/custom/FormElement";
import { CircleX, Loader, FolderSync } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "@inertiajs/react";
import { SelectOption } from "@/types/global";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogFooter,
    DialogHeader,
} from "@/components/ui/dialog";

const AdminModalSync = ({
    available_cashiers,
}: {
    available_cashiers: SelectOption[];
}) => {
    const {
        data,
        setData,
        errors,
        post,
        processing,
        reset,
        clearErrors,
        setError,
    } = useForm({
        cashier_id: "",
    });

    const handleChange = (key: keyof typeof data, value: string) => {
        setData(key, value);
    };

    const validateForm = (): boolean => {
        let isValid = true;
        clearErrors();
        if (!data.cashier_id) {
            setError("cashier_id", "Target kasir wajib diisi");
            isValid = false;
        }
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        post("/admin/sync-data/sync", {
            replace: true,
            preserveState: true,
            onFinish: () => reset(),
        });
    };
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={"yellow"}>
                    <FolderSync />
                    <span>Sinkronisasi Baru</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-7xl">
                <DialogHeader>
                    <DialogTitle>Tambahkan sinkronisasi baru</DialogTitle>
                    <DialogDescription className="mb-3">
                        Silakan lengkapi form dibawah
                    </DialogDescription>
                    <div className="flex flex-col w-full">
                        <label
                            htmlFor="cashier_id"
                            className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1"
                        >
                            Target Kasir
                        </label>
                        <SelectSearchInput
                            options={available_cashiers}
                            placeholder="Pilih kasir"
                            value={data.cashier_id}
                            onChange={(value) =>
                                handleChange("cashier_id", value.toString())
                            }
                            disabled={processing}
                        />
                        {errors.cashier_id && (
                            <ErrorInput error={errors.cashier_id} />
                        )}
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
                        type="submit"
                        variant={"yellow"}
                        className="flex items-center gap-2"
                        disabled={processing}
                        onClick={handleSubmit}
                    >
                        {processing ? (
                            <Loader className="animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                <FolderSync />
                                <span>Sinkronisasi Sekarang</span>
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AdminModalSync;
