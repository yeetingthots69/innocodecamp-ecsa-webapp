'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import TrashBinCard from '@/components/TrashBinCard';
import LatestClassification from '@/components/LatestClassification';
import RecentActivity from '@/components/RecentActivity';
import DailySummary from '@/components/DailySummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bin } from '@/types/bins';
import { TrashData } from '@/types/trash';

export default function DashboardPage() {
    const [bins, setBins] = useState<Bin[]>([]);
    const [factIndex, setFactIndex] = useState(0);
    const [facts, setFacts] = useState<string[]>([]);
    const [latestTrash, setLatestTrash] = useState<TrashData | null>(null);
    const [trashHistory, setTrashHistory] = useState<TrashData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch('/api/bins');
            const data = await res.json();
            setBins(data);
        };

        fetchData();
        const dataInterval = setInterval(fetchData, 1000);
        return () => clearInterval(dataInterval);
    }, []);

    useEffect(() => {
        const fetchFacts = async () => {
            const res = await fetch('/api/facts');
            if (!res.ok) {
                console.error('Failed to fetch facts');
                return;
            }
            const data = await res.json();
            setFacts(data);
            if (data.length > 0) {
                setFactIndex(Math.floor(Math.random() * data.length));
            }
        }
        fetchFacts();
    }, []);

    useEffect(() => {
        if (facts.length === 0) return;
        const factsInterval = setInterval(() => {
            let next;
            do {
                next = Math.floor(Math.random() * facts.length);
            } while (next === factIndex && facts.length > 1);
            setFactIndex(next);
        }, 10000);
        return () => clearInterval(factsInterval);
    }, [facts, factIndex]);

    useEffect(() => {
        const fetchTrashData = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/trash');
                if (!res.ok) {
                    console.error('failed to fetch trash data');
                    return;
                }
                const result = await res.json();

                if (result.success && result.data.length > 0) {
                    // Get the latest trash entry
                    const sortedData = result.data.sort((a: TrashData, b: TrashData) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                    setLatestTrash(sortedData[0]);
                    setTrashHistory(sortedData.slice(0, 5)); // Keep last 5 entries
                }
            } catch (error) {
                console.error('Error fetching trash data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrashData();
        // Poll for new data every 5 seconds
        //TODO: change this timeout to depend on the signal of the hardware
        const trashInterval = setInterval(fetchTrashData, 5000);
        return () => clearInterval(trashInterval);
    }, []);

    const handlePrev = () => {
        setFactIndex((prev) => (prev === 0 ? facts.length - 1 : prev - 1));
    };
    const handleNext = () => {
        setFactIndex((prev) => (prev === facts.length - 1 ? 0 : prev + 1));
    };

    return (
        <main className="p-6 min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <span role="img" aria-label="Trash Bin">🗑️</span>
                        Smart Trash Bin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Monitor fill levels and status of smart trash bins in real time.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => router.push('/login')}>
                        Login
                    </Button>
                    {localStorage.getItem('isAdmin') && (
                        <Button variant="outline" onClick={() => router.push('/admin')}>
                            Admin Panel
                        </Button>
                    )}
                </div>
            </div>

            {/* Live Trash Feed Panel */}
            <div className="grid gap-6 mb-8 lg:grid-cols-2">
                <LatestClassification latestTrash={latestTrash} isLoading={isLoading} />
                <RecentActivity trashHistory={trashHistory} />
            </div>

            {/* Daily Summary Panel */}
            <div className="mb-8">
                <DailySummary trashHistory={trashHistory} />
            </div>

            <Card className="mb-8 shadow-md">
                <CardContent className="py-6">
                    <p className="text-center text-base text-gray-700">
                        Welcome! This dashboard helps you track the fill levels of connected trash bins across your
                        facility. Stay informed and optimize waste collection efficiently.
                    </p>
                </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {bins.map(bin => (
                    <TrashBinCard key={bin.id} bin={bin} />
                ))}
            </div>

            <br />

            <Card className="mx-auto max-w-lg mb-4 shadow-sm">
                <CardHeader>
                    <CardTitle>Fun facts</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3 py-4 justify-center">
                    <button
                        aria-label="Previous Fact"
                        onClick={handlePrev}
                        className="px-2 text-xl hover:text-blue-600"
                    >
                        &#8592;
                    </button>
                    <span
                        className="inline-block text-green-600 animate-spin"
                        style={{ animationDuration: '2s' }}
                        role="img"
                        aria-label="Recycle"
                    >
                        ♻️
                    </span>
                    <span className="text-base text-gray-700">
                        {facts[factIndex]}
                    </span>
                    <button
                        aria-label="Next Fact"
                        onClick={handleNext}
                        className="px-2 text-xl hover:text-blue-600"
                    >
                        &#8594;
                    </button>
                </CardContent>
            </Card>

            <footer className="mt-12 py-6 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} Smart Trash Bin Dashboard &mdash; Making waste management smarter.
            </footer>
        </main>
    );
}