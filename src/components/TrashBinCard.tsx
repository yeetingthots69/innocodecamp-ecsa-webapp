import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {Bin} from "@/types/bins";
import Image from "next/image";

export default function TrashBinCard({ bin }: { bin: Bin }) {
    let statusColor = "text-green-600";
    const binLevel = bin.level ? bin.level : 0;
    const binLevelLastUpdated = bin.lastUpdated ? new Date(bin.lastUpdated).toLocaleString() : "Not updated";
    if (binLevel >= 80) statusColor = "text-red-600";
    else if (binLevel >= 50) statusColor = "text-yellow-600";

    // Image path
    const imageSrc = `/${bin.id}.jpg`;
    const fallbackSrc = "/bin-placeholder.jpg"; // Place a placeholder image in public/images

    return (
        <Card>
            <CardHeader>
                <CardTitle>{bin.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        <Image
                            src={imageSrc}
                            alt={`${bin.name} image`}
                            width={80}
                            height={80}
                            className="rounded shadow"
                        />
                    </div>
                    <div className="flex flex-col flex-grow space-y-2">
                        <Progress value={binLevel} />
                        <p className={`text-sm font-medium ${statusColor}`}>
                            Fill Level: {binLevel}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Last updated: {binLevelLastUpdated}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}