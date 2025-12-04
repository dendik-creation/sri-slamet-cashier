export type AppSetting = {
    id?: number;
    app_name: string;
    head_address: string;
    branch_address: string;
    tax_applied: number;
    initial_invoice_code: string;
};

export type AdminAppSettingIndexProps = PageTitleProps & {
    app_setting: AppSetting;
};
