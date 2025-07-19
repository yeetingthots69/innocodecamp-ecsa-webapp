// src/bluetooth-server.ts
import express from 'express';
import { SerialPort } from 'serialport';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

type Bin = {
    id: string;
    name: string;
    height: number;
    level?: number;
    lastUpdated?: string; // Locale date string
}

const app = express();
app.use(cors());

const binsFilePath = path.join(process.cwd(), 'src', 'data', 'bins.json');

// Cache data to avoid frequent file reads
const latestData: Record<string, Bin> = {};

const port = new SerialPort({
    path: 'COM1',
    baudRate: 9600
});

port.on('data', (data: Buffer) => {
    // Read the bins from the JSON file only once
    const bins: Bin[] = JSON.parse(fs.readFileSync(binsFilePath, "utf8"));
    const str = data.toString().trim(); // e.g. "bin_id=bin1;level=72"
    const parts = str.split(';');
    // Parse the data into key-value pairs
    const result: Record<string, string> = {};
    parts.forEach((part: string) => {
        const [key, value] = part.split('=');
        if (key && value) result[key] = value;
    });
    // Check if the result contains bin_id and level
    if (result.bin_id && result.level) {
        const bin = bins.find(bin => bin.id === result.bin_id);
        // If the bin exists, update the latestData cache
        if (bin) {
            latestData[result.bin_id] = {
                ...bin,
                level: parseInt(result.level, 10),
                lastUpdated: new Date().toLocaleString()
            };
        } else {
            delete latestData[result.bin_id];
        }
        console.log(latestData);
    }
});

app.get('/bins', (req, res) => {
    // Always read bins.json to get latest metadata
    const bins: Bin[] = JSON.parse(fs.readFileSync(binsFilePath, "utf8"));
    // Merge with latestData (levels, lastUpdated)
    const merged = bins.map(bin => ({
        ...bin,
        ...(latestData[bin.id] ? {
            level: latestData[bin.id].level,
            lastUpdated: latestData[bin.id].lastUpdated
        } : {})
    }));
    res.json(merged);
});

const serverPort = 3001;
app.listen(serverPort, () => {
    console.log(`Bluetooth bridge server running at http://localhost:${serverPort}`);
});