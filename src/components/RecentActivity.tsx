'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrashData } from '@/types/trash';

interface RecentActivityProps {
    trashHistory: TrashData[];
}

export default function RecentActivity({ trashHistory }: RecentActivityProps) {
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
        <Card className="shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                    📈 Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {trashHistory.length > 0 ? (
                        trashHistory.map((item, index) => (
                            <div
                                key={item.timestamp || index}
                                className={`flex items-center justify-between p-2 rounded-lg ${index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                                    <div>
                                        <span className="text-sm font-medium capitalize">{item.category}</span>
                                        <p className="text-xs text-gray-500">{formatTime(item.timestamp)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${getConfidenceColor(item.confidence)}`}
                                    >
                                        {(item.confidence * 100).toFixed(0)}%
                                    </Badge>
                                    <span className={`text-sm ${item.recyclingInfo.canRecycle ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.recyclingInfo.canRecycle ? "♻️" : "🗑️"}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            <span className="text-2xl mb-1 block">📂</span>
                            No recent activity
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}