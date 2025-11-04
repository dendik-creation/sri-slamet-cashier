import AppLayout from "@/partials/AppLayout";
import { PageTitle } from "@/Partials/PageTitle";
import { CashierDashboardProps } from "@/types/dashboard";

const CashierDashboard = ({ title, description }: CashierDashboardProps) => {
    return (
        <AppLayout>
            <PageTitle title={title} description={description} />
        </AppLayout>
    );
};

export default CashierDashboard;
