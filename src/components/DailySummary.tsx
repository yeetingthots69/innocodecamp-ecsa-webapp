'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrashData } from '@/types/trash';
import { useMemo } from 'react';

interface DailySummaryProps {
    trashHistory: TrashData[];
}

interface DayStats {
    totalItems: number;
    recyclableItems: number;
    nonRecyclableItems: number;
    recyclingRate: number;
    categories: Record<string, number>;
    averageConfidence: number;
    hourlyDistribution: Record<string, number>;
}

export default function DailySummary({ trashHistory }: DailySummaryProps) {
    const dailyStats = useMemo<DayStats>(() => {
        const today = new Date().toDateString();
        const todayData = trashHistory.filter(item =>
            new Date(item.timestamp).toDateString() === today
        );

        if (todayData.length === 0) {
            return {
                totalItems: 0,
                recyclableItems: 0,
                nonRecyclableItems: 0,
                recyclingRate: 0,
                categories: {},
                averageConfidence: 0,
                hourlyDistribution: {}
            };
        }

        const recyclableItems = todayData.filter(item => item.recyclingInfo.canRecycle).length;
        const nonRecyclableItems = todayData.length - recyclableItems;
        const recyclingRate = (recyclableItems / todayData.length) * 100;

        // Category breakdown
        const categories = todayData.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Average confidence
        const averageConfidence = todayData.reduce((sum, item) => sum + item.confidence, 0) / todayData.length;

        // Hourly distribution
        const hourlyDistribution = todayData.reduce((acc, item) => {
            const hour = new Date(item.timestamp).getHours();
            const hourKey = `${hour}:00`;
            acc[hourKey] = (acc[hourKey] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalItems: todayData.length,
            recyclableItems,
            nonRecyclableItems,
            recyclingRate,
            categories,
            averageConfidence,
            hourlyDistribution
        };
    }, [trashHistory]);

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

    const getRecyclingColor = (rate: number) => {
        if (rate >= 70) return 'text-green-600';
        if (rate >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    // Create simple bar chart for categories
    const maxCategoryCount = Math.max(...Object.values(dailyStats.categories));

    // Get peak hours
    const peakHour = Object.entries(dailyStats.hourlyDistribution)
        .sort(([, a], [, b]) => b - a)[0];

    return (
        <Card className="shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                    📊 Today's Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {dailyStats.totalItems === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">📈</span>
                        No data for today yet
                    </div>
                ) : (
                    <>
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {dailyStats.totalItems}
                                </div>
                                <div className="text-sm text-gray-600">Total Items</div>
                            </div>

                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {dailyStats.recyclableItems}
                                </div>
                                <div className="text-sm text-gray-600">Recyclable</div>
                            </div>

                            <div className="bg-red-50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {dailyStats.nonRecyclableItems}
                                </div>
                                <div className="text-sm text-gray-600">Non-Recyclable</div>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                                <div className={`text-2xl font-bold ${getRecyclingColor(dailyStats.recyclingRate)}`}>
                                    {dailyStats.recyclingRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">Recycling Rate</div>
                            </div>
                        </div>

                        {/* Recycling Rate Visualization */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-700">Recycling Rate Progress</h4>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${dailyStats.recyclingRate >= 70 ? 'bg-green-500' :
                                            dailyStats.recyclingRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(dailyStats.recyclingRate, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>0%</span>
                                <span>Target: 70%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-700">Category Breakdown</h4>
                            <div className="space-y-2">
                                {Object.entries(dailyStats.categories)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([category, count]) => (
                                        <div key={category} className="flex items-center gap-3">
                                            <span className="text-lg">{getCategoryIcon(category)}</span>
                                            <span className="text-sm font-medium capitalize w-20">
                                                {category}
                                            </span>
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${(count / maxCategoryCount) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {count}
                                            </Badge>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Additional Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-lg font-semibold text-gray-700">
                                    {(dailyStats.averageConfidence * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">Avg. Confidence</div>
                            </div>

                            {peakHour && (
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-lg font-semibold text-gray-700">
                                        {peakHour[0]}
                                    </div>
                                    <div className="text-sm text-gray-600">Peak Hour</div>
                                </div>
                            )}
                        </div>

                        {/* Hourly Activity Chart */}
                        {Object.keys(dailyStats.hourlyDistribution).length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-700">Activity Timeline</h4>
                                <div className="flex items-end gap-1 h-20 overflow-x-auto">
                                    {Array.from({ length: 24 }, (_, i) => {
                                        const hour = `${i}:00`;
                                        const count = dailyStats.hourlyDistribution[hour] || 0;
                                        const maxHourlyCount = Math.max(...Object.values(dailyStats.hourlyDistribution));
                                        const height = maxHourlyCount > 0 ? (count / maxHourlyCount) * 100 : 0;

                                        return (
                                            <div key={hour} className="flex flex-col items-center min-w-[20px]">
                                                <div
                                                    className={`w-3 bg-blue-400 rounded-t transition-all duration-300 ${count > 0 ? 'opacity-100' : 'opacity-20'
                                                        }`}
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                    title={`${hour}: ${count} items`}
                                                ></div>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    {i % 6 === 0 ? i : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-xs text-gray-500 text-center">
                                    Hours (0-23)
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}