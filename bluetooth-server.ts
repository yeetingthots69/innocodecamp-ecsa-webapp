// root: bluetooth-server.ts
import express from 'express';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

type Bin = {
    id: string;
    name: string;
    height: number;
    width: number;
    level?: number;
    lastUpdated?: string; // Locale date string
}

const app = express();
app.use(cors());

const binsFilePath = path.join(process.cwd(), 'src', 'data', 'bins.json');

// Cache data to avoid frequent file reads
const latestData: Record<string, Bin> = {};

const port = new SerialPort({
    path: 'COM4',
    baudRate: 9600
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', (line: string) => {
    const str = line.trim();
    console.log(str);
    // Read the bins from the JSON file only once
    const bins: Bin[] = JSON.parse(fs.readFileSync(binsFilePath, "utf8"));
    // Read data, convention as follows:
    // "r;bin_id=bin1;level=72;lid_closed=true" - indicates bin data
    // "i;bin_id=bin1;height=100;width=50" - indicates bin metadata;
    const parts = str.split(';');
    // Parse the data into key-value pairs
    if (parts[0] === 'r') {
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
    } else if (parts[0] === 'i') {
        const result: Record<string, string> = {};
        parts.forEach((part: string) => {
            const [key, value] = part.split('=');
            if (key && value) result[key] = value;
        });
        if (result.bin_id && result.height && result.width) {
            const bins: Bin[] = JSON.parse(fs.readFileSync(binsFilePath, "utf8"));
            const binIndex = bins.findIndex(bin => bin.id === result.bin_id);
            if (binIndex !== -1) {
                bins[binIndex].height = parseInt(result.height, 10);
                bins[binIndex].width = parseInt(result.width, 10);
            } else {
                console.log("UNIDENTIFIED BIN, ID: " + result.bin_id);
            }
            fs.writeFileSync(binsFilePath, JSON.stringify(bins, null, 2), "utf8");
        }
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