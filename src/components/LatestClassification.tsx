'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrashData } from '@/types/trash';

interface LatestClassificationProps {
    latestTrash: TrashData | null;
    isLoading: boolean;
}

export default function LatestClassification({ latestTrash, isLoading }: LatestClassificationProps) {
    // Helper function to get category icon
    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            plastic: '🥤',
            cardboard: '📦',
            glass: '🍺',
            metal: '🥫',
            paper: '📄',
            trash: '🗑️'
        };
        return icons[category.toLowerCase()] || '🗑️';
    };

    // Helper function to get confidence color
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'bg-green-100 text-green-800';
        if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    // Helper function to format time
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <Card className="shadow-lg border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <span className="animate-pulse">🔴</span>
                    Latest Classification
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                ) : latestTrash ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{getCategoryIcon(latestTrash.category)}</span>
                                <div>
                                    <h3 className="text-lg font-semibold capitalize">{latestTrash.category}</h3>
                                    <p className="text-sm text-gray-500">
                                        {formatTime(latestTrash.timestamp)}
                                    </p>
                                </div>
                            </div>
                            <Badge className={getConfidenceColor(latestTrash.confidence)}>
                                {(latestTrash.confidence * 100).toFixed(1)}% confident
                            </Badge>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Recycling Info:</h4>
                            <div className="flex items-start gap-2">
                                <span className={latestTrash.recyclingInfo.canRecycle ? "text-green-600" : "text-red-600"}>
                                    {latestTrash.recyclingInfo.canRecycle ? "♻️" : "❌"}
                                </span>
                                <p className="text-sm text-gray-600">
                                    {latestTrash.recyclingInfo.instructions}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">📭</span>
                        No trash data available
                    </div>
                )}
            </CardContent>
        </Card>
    );
}