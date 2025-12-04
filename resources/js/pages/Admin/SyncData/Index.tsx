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
    CloudAlert,
    CloudCheck,
    FolderClock,
    Hourglass,
    LucideProps,
    RefreshCcwDot,
} from "lucide-react";
import {
    ForwardRefExoticComponent,
    RefAttributes,
    useEffect,
    useState,
} from "react";
import { cn } from "@/lib/utils";
import axios from "axios";

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

const AdminSyncDataIndex = ({
    title,
    description,
    sync_folders,
}: AdminSyncDataIndexProps) => {
    const [syncFolders, setSyncFolders] = useState(sync_folders);
    const [inSyncing, setInSyncing] = useState(
        [] as { folder_name: string; is_syncing: boolean }[],
    );
    const refreshStatus = async (folder_name: string) => {
        setInSyncing((prev) => {
            const existing = prev.find(
                (item) => item.folder_name === folder_name,
            );
            if (existing) {
                return prev.map((item) =>
                    item.folder_name === folder_name
                        ? { ...item, is_syncing: true }
                        : item,
                );
            } else {
                return [...prev, { folder_name, is_syncing: true }];
            }
        });

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
            setInSyncing((prev) =>
                prev.filter((item) => item.folder_name !== folder_name),
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
                                        {item.current_record.error_message
                                            ? item.current_record.error_message
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline">
                                                <FolderClock />
                                                <span>Riwayat</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {syncFolders.length == 0 && (
                            <EmptyTable
                                colSpan={6}
                                message="Sinkronisasi tidak ada"
                            />
                        )}
                    </TableBody>
                </Table>
            </div>
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
