import {
    ChartArea,
    ChartColumnBig,
    ChartLine,
    ChartNoAxesColumn,
    ChartPie,
} from "lucide-react";
import React from "react";

type EmptyChartProps = {
    type: "AREA" | "BAR" | "LINE" | "PIE" | "DONUT";
};

const EmptyChart: React.FC<EmptyChartProps> = ({ type }) => {
    const ChartIconType = (size: number) => {
        switch (type) {
            case "AREA":
                return <ChartArea size={size} />;
            case "BAR":
                return <ChartColumnBig size={size} />;
            case "LINE":
                return <ChartLine size={size} />;
            case "PIE":
                return <ChartPie size={size} />;
            case "DONUT":
                return <ChartPie size={size} />;
            default:
                return <ChartNoAxesColumn size={size} />;
        }
    };
    return (
        <div className="flex items-center flex-col gap-4 p-4 justify-center">
            <div className="text-red-400">{ChartIconType(96)}</div>
            <p>Data Tidak Ada</p>
        </div>
    );
};

export default EmptyChart;
