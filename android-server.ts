// root: android-server.ts
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const app = express();
app.use(cors());

// Initiate multer for file uploads, storing files in 'uploads/' directory
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('image'), (req, res) => {
    const tempPath = req.file?.path;
    if (!tempPath) {
        console.log('No file uploaded');
        return res.status(400).send('No file uploaded');
    }
    const targetPath = path.join(process.cwd(), 'uploads', `${Date.now()}.jpg`);

    fs.rename(tempPath, targetPath, err => {
        if (err) return res.sendStatus(500);
        console.log('Image received:', targetPath);
        res.sendStatus(200);
    });
});

const serverPort = 3002;
app.listen(serverPort, () => {
    console.log(`Android server running at http://localhost:${serverPort}`);
});