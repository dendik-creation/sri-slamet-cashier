export type AppSetting = {
    id?: number;
    app_name: string;
    head_address: string;
    branch_address: string;
    tax_applied: number;
};

export type AdminAppSettingIndexProps = PageTitleProps & {
    app_setting: AppSetting;
};
