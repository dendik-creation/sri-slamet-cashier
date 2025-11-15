import {
    SearchInput,
    SelectSearchInput,
} from "@/components/custom/FormElement";
import {
    humanRole,
    inputDebounce,
    ymdToIdDate,
} from "@/components/helper/helper";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import { AdminUserIndexProps } from "@/types/user";
import { router, useForm } from "@inertiajs/react";
import { SearchXIcon, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import AdminUserCreate from "./ModalCreate";
import AdminUserEdit from "./ModalEdit";
import AdminUserModalResetPassword from "./ModalResetPassword";
import ConfirmDialog from "@/components/custom/ConfirmDialog";
import EmptyTable from "@/components/custom/EmptyTable";

const AdminUserIndex = ({
    title,
    description,
    users,
    search,
    role,
}: AdminUserIndexProps) => {
    const firstRender = useRef(true);
    const { data: filterData, setData: setFilterData } = useForm({
        search: search || "",
        role: role || "",
    });

    const handleFilter = (key: keyof typeof filterData, value: string) => {
        setFilterData(key, value);
    };

    const debounceSearch = inputDebounce((data: typeof filterData) => {
        router.get(
            "/admin/users",
            {
                search: data.search,
                role: data.role,
            },
            {
                preserveState: true,
                replace: true,
                only: ["users"],
            }
        );
    });

    const handleDelete = (id: number) => {
        router.delete(`/admin/users/${id}`, {
            preserveScroll: true,
            replace: true,
            only: ["users"],
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
                        placeholder={`Cari berdasarkan NIP atau nama karyawan`}
                        className="lg:max-w-sm w-full"
                        onChange={(e) => handleFilter("search", e.target.value)}
                        value={filterData.search || ""}
                    />
                    <div className="">
                        <SelectSearchInput
                            className="w-full"
                            placeholder="Pilih Role"
                            value={filterData.role || ""}
                            options={[
                                {
                                    label: "Kasir",
                                    value: "CASHIER",
                                },
                                {
                                    label: "Administrator",
                                    value: "ADMIN",
                                },
                            ]}
                            onChange={(value) =>
                                handleFilter("role", value.toString())
                            }
                            removeValue={() => handleFilter("role", "")}
                        />
                    </div>
                </div>
                <AdminUserCreate />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-stone-200 font-semibold">
                                #
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Username
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Nama
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Role
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Bergabung sejak
                            </TableHead>
                            <TableHead className="bg-stone-200 font-semibold">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.data.map((user, index) => (
                            <TableRow key={user.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{humanRole(user.role)}</TableCell>
                                <TableCell>
                                    {ymdToIdDate(user.created_at)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <AdminUserEdit user={user} />
                                        <AdminUserModalResetPassword
                                            id={user.id}
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
                                            title="Hapus User"
                                            description="Menghapus user menyebabkan kehilangan akses terhadap sistem. Apakah anda yakin ?"
                                            type="danger"
                                            confirmAction={() =>
                                                handleDelete(user.id)
                                            }
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.data.length == 0 && (
                            <EmptyTable colSpan={6} message="User tidak ada" />
                        )}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
};

export default AdminUserIndex;
