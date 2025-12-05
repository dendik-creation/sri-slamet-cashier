import AppLayout from "@/partials/AppLayout";
import { PageTitle, PageTitleProps } from "@/Partials/PageTitle";
import AdminModalSync from "./ModalSync";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import EmptyTable from "@/components/custom/EmptyTable";
import { ymdToIdDate } from "@/components/helper/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BadgeInfo,
    CircleX,
    CloudAlert,
    CloudCheck,
    FolderClock,
    Hourglass,
    LucideProps,
    RefreshCcwDot,
    X,
} from "lucide-react";
import {
    ForwardRefExoticComponent,
    RefAttributes,
    useEffect,
    useState,
} from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
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

type AdminSyncDataIndexProps = PageTitleProps & {
    sync_folders: {
        folder_name: string;
        current_step: string;
        target: {
            name: string;
            location: "NORTH" | "SOUTH";
            device_code: string;
        };
        current_record: {
            step: string;
            time: {
                pending_at: string;
                syncing_at: string | null;
                completed_at: string | null;
                failed_at: string | null;
            };
            status: "PENDING" | "SYNCING" | "COMPLETED" | "FAILED";
            error_message: string | null;
        };
        records: {
            step: string;
            time: {
                pending_at: string;
                syncing_at: string | null;
                completed_at: string | null;
                failed_at: string | null;
            };
            status: "PENDING" | "SYNCING" | "COMPLETED" | "FAILED";
            error_message: string | null;
        }[];
    }[];
};

const CreateStatusBadge = ({
    status,
}: {
    status: "PENDING" | "SYNCING" | "COMPLETED" | "FAILED";
}) => {
    const colorByStatus: {
        [key: string]: "blue" | "green" | "red" | "yellow" | "outline";
    } = {
        PENDING: "yellow",
        SYNCING: "blue",
        COMPLETED: "green",
        FAILED: "red",
    };

    const labelByStatus: { [key: string]: string } = {
        PENDING: "Sedang disiapkan",
        SYNCING: "Sinkronisasi berlangsung",
        COMPLETED: "Berhasil",
        FAILED: "Gagal",
    };

    const iconByStatus: {
        [key: string]:
            | ForwardRefExoticComponent<
                  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
              >
            | undefined;
    } = {
        PENDING: Hourglass,
        SYNCING: RefreshCcwDot,
        COMPLETED: CloudCheck,
        FAILED: CloudAlert,
    };

    return (
        <Badge
            className="flex items-center gap-2"
            variant={colorByStatus[status] ?? "outline"}
        >
            {(() => {
                const Icon = iconByStatus[status];
                return Icon ? (
                    <Icon
                        className={cn(
                            status == "PENDING" || status == "SYNCING"
                                ? "animate-spin"
                                : "",
                        )}
                    />
                ) : null;
            })()}
            {labelByStatus[status] ?? "Tidak diketahui"}
        </Badge>
    );
};

const ShowErrorDetailModal = ({
    folder_name,
    sync_step,
    error,
    isOpen,
    onOpenChange,
}: {
    folder_name: string;
    sync_step: string;
    error: string;
    isOpen: boolean;
    onOpenChange?: (open: boolean) => void;
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Sinkronisasi Error</DialogTitle>
                    <DialogDescription className="mb-4">
                        Detail error yang ditampilkan untuk langkah sinkronisasi
                        yang dipilih
                    </DialogDescription>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-700">
                            Sinkronisasi{" "}
                            {folder_name == "north"
                                ? "Bengkel Utara"
                                : "Bengkel Selatan"}{" "}
                            ke-{sync_step}
                        </span>
                        <span>{error}</span>
                    </div>
                </DialogHeader>
                <DialogFooter className="mt-9">
                    <DialogClose asChild>
                        <Button
                            variant="red"
                            className="flex items-center gap-2"
                        >
                            <CircleX /> Tutup
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AdminSyncDataIndex = ({
    title,
    description,
    sync_folders,
}: AdminSyncDataIndexProps) => {
    const [syncFolders, setSyncFolders] = useState(sync_folders);
    const [syncHistory, setSyncHistory] = useState({
        visible: false as boolean,
        folder_name: "" as string,
        records: [] as AdminSyncDataIndexProps["sync_folders"][0]["records"],
    });
    const [errorModal, setErrorModal] = useState({
        visible: false,
        folder_name: "",
        sync_step: "",
        error: "",
    });
    const refreshStatus = async (folder_name: string) => {
        try {
            const response = await axios.get("/admin/sync-data/status", {
                params: { folder_name },
            });
            setSyncFolders((prev) =>
                prev.map((item) =>
                    item.folder_name === folder_name
                        ? {
                              ...item,
                              current_step:
                                  response.data.current_step ??
                                  item.current_step,
                              current_record:
                                  response.data.current_record ??
                                  item.current_record,
                              records: response.data.records ?? item.records,
                          }
                        : item,
                ),
            );
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            syncFolders.forEach((item) => {
                if (
                    item.current_record.status != "COMPLETED" &&
                    item.current_record.status != "FAILED"
                ) {
                    refreshStatus(item.folder_name);
                }
            });
        }, 15000);

        return () => clearInterval(interval);
    }, [syncFolders]);

    const handleHistoryMode = (
        folder_name: string,
        mode: "VISIBLE" | "CLOSE",
    ) => {
        setSyncHistory({
            visible: mode === "VISIBLE" ? true : false,
            folder_name: mode === "VISIBLE" ? folder_name : "",
            records:
                mode === "VISIBLE"
                    ? syncFolders
                          .find((item) => item.folder_name === folder_name)
                          ?.records?.sort(
                              (a, b) => Number(b.step) - Number(a.step),
                          ) || []
                    : [],
        });
    };
    const handleErrorDetailModal = (
        folder_name: string,
        sync_step: string,
        error: string,
        isOpen: boolean,
    ) => {
        setErrorModal({
            visible: isOpen,
            folder_name: folder_name,
            sync_step: sync_step,
            error: error,
        });
    };
    const CreateSyncHistoryRowTable = ({
        folder_name,
        records,
        visible,
    }: {
        folder_name: string;
        records: AdminSyncDataIndexProps["sync_folders"][0]["records"];
        visible: boolean;
    }) => {
        return visible ? (
            <TableRow key={folder_name}>
                <TableCell colSpan={6}>
                    <div className="rounded-md border mt-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="bg-stone-100 font-semibold">
                                        Sinkron ke-
                                    </TableHead>
                                    <TableHead className="bg-stone-100 font-semibold">
                                        Status
                                    </TableHead>
                                    <TableHead className="bg-stone-100 font-semibold">
                                        Menunggu pada
                                    </TableHead>
                                    <TableHead className="bg-stone-100 font-semibold">
                                        Berlangsung pada
                                    </TableHead>
                                    <TableHead className="bg-stone-100 font-semibold">
                                        Berhasil pada
                                    </TableHead>
                                    <TableHead className="bg-stone-100 font-semibold">
                                        Gagal pada
                                    </TableHead>
                                    <TableHead className="bg-stone-100 font-semibold">
                                        Error
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.length > 0 ? (
                                    records.map((rec, idx) => (
                                        <TableRow
                                            key={`${folder_name}-${idx}-${rec.step}`}
                                        >
                                            <TableCell>{rec.step}</TableCell>
                                            <TableCell>
                                                <CreateStatusBadge
                                                    status={
                                                        rec.status as
                                                            | "PENDING"
                                                            | "SYNCING"
                                                            | "COMPLETED"
                                                            | "FAILED"
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {ymdToIdDate(
                                                    rec.time.pending_at,
                                                    true,
                                                ) || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {ymdToIdDate(
                                                    rec.time.syncing_at,
                                                    true,
                                                ) || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {ymdToIdDate(
                                                    rec.time.completed_at,
                                                    true,
                                                ) || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {ymdToIdDate(
                                                    rec.time.failed_at,
                                                    true,
                                                ) || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {rec.error_message ? (
                                                    <Button
                                                        onClick={() =>
                                                            handleErrorDetailModal(
                                                                folder_name,
                                                                rec.step,
                                                                rec.error_message ||
                                                                    "",
                                                                true,
                                                            )
                                                        }
                                                        variant={"red"}
                                                        size={"icon"}
                                                    >
                                                        <CloudAlert />
                                                    </Button>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <EmptyTable
                                        colSpan={7}
                                        message="Riwayat sinkronisasi kosong"
                                    />
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TableCell>
            </TableRow>
        ) : null;
    };
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-3">
                <PageTitle title={title} description={description} />
                <AdminModalSync />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-stone-200 font-semibold">
                                #
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Untuk Bengkel
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Status Sinkronisasi
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Waktu Sinkronisasi
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Error (Jika ada)
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {syncFolders.length > 0 &&
                            syncFolders.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">
                                                {item.target.name}
                                            </span>
                                            <span className="text-xs">
                                                Sinkronisasi ke{"-"}
                                                {item.current_step}
                                            </span>
                                            <pre className="text-xs text-stone-500">
                                                {item.target.device_code || "-"}
                                            </pre>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <CreateStatusBadge
                                            status={
                                                item.current_record.status as
                                                    | "PENDING"
                                                    | "SYNCING"
                                                    | "COMPLETED"
                                                    | "FAILED"
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Hourglass
                                                    className="text-yellow-600"
                                                    size={18}
                                                />
                                                <span>
                                                    {ymdToIdDate(
                                                        item.current_record.time
                                                            .pending_at,
                                                        true,
                                                    ) || "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <RefreshCcwDot
                                                    size={18}
                                                    className="text-blue-600"
                                                />
                                                <span>
                                                    {ymdToIdDate(
                                                        item.current_record.time
                                                            .syncing_at,
                                                        true,
                                                    ) || "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <CloudCheck
                                                    className="text-green-600"
                                                    size={18}
                                                />
                                                <span>
                                                    {ymdToIdDate(
                                                        item.current_record.time
                                                            .completed_at,
                                                        true,
                                                    ) || "-"}
                                                </span>
                                            </div>
                                            {item.current_record.status !=
                                                "COMPLETED" && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <CloudAlert
                                                        className="text-red-600"
                                                        size={18}
                                                    />
                                                    <span>
                                                        {ymdToIdDate(
                                                            item.current_record
                                                                .time.failed_at,
                                                            true,
                                                        ) || "-"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.current_record.error_message ? (
                                            <Button
                                                onClick={() =>
                                                    handleErrorDetailModal(
                                                        item.folder_name,
                                                        item.current_step,
                                                        item.current_record
                                                            .error_message ||
                                                            "",
                                                        true,
                                                    )
                                                }
                                                variant={"red"}
                                                size={"sm"}
                                            >
                                                <CloudAlert />
                                                <span>Detail Error</span>
                                            </Button>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const isOpen =
                                                    syncHistory.visible &&
                                                    syncHistory.folder_name ===
                                                        item.folder_name;

                                                return (
                                                    <Button
                                                        onClick={() =>
                                                            handleHistoryMode(
                                                                item.folder_name,
                                                                isOpen
                                                                    ? "CLOSE"
                                                                    : "VISIBLE",
                                                            )
                                                        }
                                                        variant="outline"
                                                    >
                                                        <FolderClock />
                                                        <span>
                                                            {isOpen
                                                                ? "Tutup Riwayat"
                                                                : "Buka Riwayat"}
                                                        </span>
                                                    </Button>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        <CreateSyncHistoryRowTable
                            visible={syncHistory.visible}
                            folder_name={syncHistory.folder_name}
                            records={syncHistory.records}
                        />
                        {syncFolders.length == 0 && (
                            <EmptyTable
                                colSpan={6}
                                message="Sinkronisasi tidak ada"
                            />
                        )}
                    </TableBody>
                </Table>
            </div>
            <ShowErrorDetailModal
                folder_name={errorModal.folder_name}
                sync_step={errorModal.sync_step}
                error={errorModal.error}
                isOpen={errorModal.visible}
                onOpenChange={(open) =>
                    handleErrorDetailModal(
                        errorModal.folder_name,
                        errorModal.sync_step,
                        errorModal.error,
                        open,
                    )
                }
            />
            {syncFolders.length > 0 && (
                <div className="flex mt-4 items-center text-sm gap-2">
                    <BadgeInfo size={20} className="text-blue-500" />
                    <span>Data diperbarui setiap 15 detik secara otomatis</span>
                </div>
            )}
        </AppLayout>
    );
};

export default AdminSyncDataIndex;
