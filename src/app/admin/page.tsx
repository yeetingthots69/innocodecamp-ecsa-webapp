'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bin } from '@/types/bins';

export default function AdminPage() {
    const router = useRouter();
    const [bins, setBins] = useState<Bin[]>([]);
    const [form, setForm] = useState({ id: '', name: '', height: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editBinId, setEditBinId] = useState<string | null>(null);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('isAdmin');
        router.push('/login');
    }, [router]);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) router.push('/login');
        fetchBins();
    }, []);

    const fetchBins = async () => {
        const response = await fetch('/api/bins');
        const bins: Bin[] = await response.json();
        setBins(bins);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleEdit = (bin: Bin) => {
        setForm({ id: bin.id, name: bin.name, height: String(bin.height) });
        setEditBinId(bin.id);
        setError('');
        setSuccess('');
    }

    const handleCancelEdit = () => {
        setForm({ id: '', name: '', height: '' });
        setEditBinId(null);
        setError('');
        setSuccess('');
    }

    const handleDelete = async (binId: string) => {
        if (!window.confirm("Are you sure you want to delete this bin?")) return;
        const res = await fetch('/api/bins', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: binId })
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
            setError(data.message || 'Failed to delete bin');
            return;
        }
        setSuccess(data.message);
        fetchBins();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.id || !form.name || !form.height) {
            setError('All fields are required');
            return;
        }
        setError('');
        // Edit mode, use PUT request
        if (editBinId) {
            const res = await fetch('/api/bins', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: form.id,
                    name: form.name,
                    height: Number(form.height)
                })
            });
            const data = await res.json();
            if (data.success === false) {
                setError(data.message || 'Failed to update bin');
                return;
            }
            setEditBinId(null);
            setSuccess(data.message);
            return;
        } else {
            const res = await fetch('/api/bins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: form.id,
                    name: form.name,
                    height: Number(form.height)
                })
            });
            const data = await res.json();
            if (data.success === false) {
                setError(data.message || 'Failed to add bin');
                return;
            }
            setSuccess(data.message);
        }
        setForm({ id: '', name: '', height: '' });
        fetchBins();
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex justify-end gap-3 mb-6">
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
                <Button variant="outline" onClick={() => router.push('/')}>Back to Dashboard</Button>
            </div>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {editBinId ? 'Edit bin details.' : 'Add new bins and manage their details.'}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="id">Bin ID</Label>
                            <Input
                                id="id"
                                name="id"
                                value={form.id}
                                onChange={handleChange}
                                required
                                disabled={!!editBinId}
                            />
                        </div>
                        <div>
                            <Label htmlFor="name">Bin Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="height">Bin Height (cm)</Label>
                            <Input
                                id="height"
                                name="height"
                                type="number"
                                min={1}
                                value={form.height}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        {success && <p className="text-sm text-green-500 text-center">{success}</p>}
                        <div className="flex gap-2">
                            <Button type="submit" className="w-full">
                                {editBinId ? 'Update Bin' : 'Add Bin'}
                            </Button>
                            {editBinId && (
                                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Existing Bins</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {bins.map(bin => (
                            <li key={bin.id} className="border-b pb-2 flex justify-between items-center">
                                <span>
                                    <strong>{bin.name}</strong> (ID: {bin.id}, Height: {bin.height} cm)
                                </span>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(bin)}>
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(bin.id)}
                                >
                                    Delete
                                </Button>
                            </li>
                        ))}
                        {bins.length === 0 && <p className="text-muted-foreground">No bins added yet.</p>}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}