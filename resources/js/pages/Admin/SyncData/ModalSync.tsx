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

const deviceLocationTargets: SelectOption[] = [
    {
        label: "Kasir - Bengkel Utara",
        value: "NORTH",
    },
    {
        label: "Kasir - Bengkel Selatan",
        value: "SOUTH",
    },
];

const AdminModalSync = () => {
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
        location_target: "",
    });

    const handleChange = (key: keyof typeof data, value: string) => {
        setData(key, value);
    };

    const validateForm = (): boolean => {
        let isValid = true;
        clearErrors();
        if (!data.location_target) {
            setError("location_target", "Target bengkel wajib diisi");
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
                            htmlFor="location_target"
                            className="text-base mb-1 after:content-['*'] after:text-red-500 after:ml-1"
                        >
                            Target Bengkel
                        </label>
                        <SelectSearchInput
                            options={deviceLocationTargets}
                            placeholder="Pilih bengkel target sinkronisasi"
                            value={data.location_target}
                            onChange={(value) =>
                                handleChange(
                                    "location_target",
                                    value.toString(),
                                )
                            }
                            disabled={processing}
                        />
                        {errors.location_target && (
                            <ErrorInput error={errors.location_target} />
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
