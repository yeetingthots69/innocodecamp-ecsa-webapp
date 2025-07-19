import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {Bin} from "@/types/bins";

export default function TrashBinCard({ bin }: { bin: Bin }) {
    let statusColor = "text-green-600";
    const binLevel = bin.level || 0;
    const binLevelLastUpdated = bin.lastUpdated ? new Date(bin.lastUpdated).toLocaleString() : "Not updated";
    if (binLevel >= 80) statusColor = "text-red-600";
    else if (binLevel >= 50) statusColor = "text-yellow-600";

    return (
        <Card>
            <CardHeader>
                <CardTitle>{bin.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={binLevel} />
                <p className={`text-sm font-medium ${statusColor}`}>
                    Fill Level: {binLevel}%
                </p>
                <p className="text-xs text-muted-foreground">
                    Last updated: {binLevelLastUpdated}
                </p>
            </CardContent>
        </Card>
    );
}