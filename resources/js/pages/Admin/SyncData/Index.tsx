import AppLayout from "@/partials/AppLayout";
import { PageTitle, PageTitleProps } from "@/Partials/PageTitle";
import { SelectOption } from "@/types/global";
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
    CloudAlert,
    CloudCheck,
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
    available_cashiers: SelectOption[];
    sync_folders: {
        folder_name: string;
        request_at: string;
        request_to: string;
        device_code: string;
        status: string;
        error_message: string | null;
        respond_at: string | null;
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
        PENDING: "Disiapkan kasir",
        SYNCING: "Sinkronisasi..",
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
    available_cashiers,
    sync_folders,
}: AdminSyncDataIndexProps) => {
    const [syncFolders, setSyncFolders] = useState(sync_folders);
    const [inSyncing, setInSyncing] = useState(
        [] as { folder_name: string; is_syncing: boolean }[],
    );
    const refreshStatus = async (folder_name: string) => {
        // Set or update inSyncing state by folder_name
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

        // Call API
        try {
            const response = await axios.get("/admin/sync-data/status", {
                params: { folder_name },
            });
            // Update syncFolders state
            setSyncFolders((prev) => {
                return prev.map((item) =>
                    item.folder_name === folder_name
                        ? {
                              ...item,
                              status: response.data.status,
                              error_message: response.data.error_message,
                              respond_at: response.data.respond_at,
                          }
                        : item,
                );
            });
            // Remove from inSyncing state
            setInSyncing((prev) =>
                prev.filter((item) => item.folder_name !== folder_name),
            );
        } catch (error) {
            console.error(error);
        }
    };
    const findSyncingFolder = (
        folder_name: string,
    ): { folder_name: string; is_syncing: boolean } => {
        return inSyncing.find((item) => item.folder_name === folder_name) as {
            folder_name: string;
            is_syncing: boolean;
        };
    };

    useEffect(() => {
        const interval = setInterval(() => {
            syncFolders.forEach((item) => {
                refreshStatus(item.folder_name);
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [syncFolders]);
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-3">
                <PageTitle title={title} description={description} />
                <AdminModalSync available_cashiers={available_cashiers} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-stone-200 font-semibold">
                                #
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Untuk Kasir
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Waktu Permintaan
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Status Sinkronisasi
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Waktu Selesai
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
                                            <span>{item.request_to}</span>
                                            <pre className="text-xs text-stone-500">
                                                {item.device_code}
                                            </pre>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {ymdToIdDate(item.request_at, true)}
                                    </TableCell>
                                    <TableCell>
                                        <CreateStatusBadge
                                            status={
                                                item.status as
                                                    | "PENDING"
                                                    | "SYNCING"
                                                    | "COMPLETED"
                                                    | "FAILED"
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {ymdToIdDate(item.respond_at, true) ||
                                            "-"}
                                    </TableCell>
                                    <TableCell>
                                        {item.error_message
                                            ? item.error_message
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const isSyncing =
                                                    !!findSyncingFolder(
                                                        item.folder_name,
                                                    )?.is_syncing;
                                                const handleRefresh = () =>
                                                    refreshStatus(
                                                        item.folder_name,
                                                    );
                                                return (
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleRefresh}
                                                        disabled={isSyncing}
                                                    >
                                                        <RefreshCcwDot
                                                            className={cn(
                                                                isSyncing &&
                                                                    "animate-spin",
                                                            )}
                                                        />
                                                        <span>Refresh</span>
                                                    </Button>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        {sync_folders.length == 0 && (
                            <EmptyTable
                                colSpan={7}
                                message="Sinkronisasi tidak ada"
                            />
                        )}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
};

export default AdminSyncDataIndex;
