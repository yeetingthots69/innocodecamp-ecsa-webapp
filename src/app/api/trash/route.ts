import { TrashData } from "@/types/trash";
import path from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile, readdir } from "fs/promises"

// Input data interface
interface HuggingFaceInput {
    inputs: string; // Base64 encoded image string
}

// Single classification result
interface ClassificationResult {
    label: string;    // e.g., "cardboard", "glass", "metal", "paper", "plastic", "trash"
    score: number;    // Confidence score between 0 and 1
}

// API response type (array of classification results, sorted by confidence)
type HuggingFaceResponse = ClassificationResult[];

// Error response interface
interface HuggingFaceError {
    error: string;
    estimated_time?: number;
}


// Complete response type (success or error)
type APIResponse = HuggingFaceResponse | HuggingFaceError;

// Function to convert image file to base64
async function imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data:image/jpeg;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Main query function with proper typing
async function query(data: HuggingFaceInput): Promise<APIResponse> {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/yangy50/garbage-classification",
        {
            headers: {
                Authorization: `Bearer ${process.env.HF_TOKEN}`,
                "Content-Type": "application/json", // Changed from image/jpeg
            },
            method: "POST",
            body: JSON.stringify(data), // This is correct for base64 input
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
}

// Alternative function for direct file upload (better for large images)
async function queryWithFile(file: File): Promise<APIResponse> {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/yangy50/garbage-classification",
        {
            headers: {
                Authorization: `Bearer ${process.env.HF_TOKEN}`,
                // Don't set Content-Type for FormData, let browser set it
            },
            method: "POST",
            body: file, // Send file directly
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
}

// Type guard to check if response is an error
function isError(response: APIResponse): response is HuggingFaceError {
    return 'error' in response;
}

// Enhanced classification function with error handling
async function classifyGarbage(imageInput: string | File): Promise<ClassificationResult[]> {
    try {
        let response: APIResponse;

        if (typeof imageInput === 'string') {
            // If input is base64 string
            response = await query({ inputs: imageInput });
        } else {
            // If input is File object
            response = await queryWithFile(imageInput);
        }

        // Handle error response
        if (isError(response)) {
            console.error('API Error:', response.error);
            if (response.estimated_time) {
                console.log(`Model loading, estimated time: ${response.estimated_time}s`);
            }
            throw new Error(response.error);
        }

        return response;
    } catch (error) {
        console.error('Classification failed:', error);
        throw error;
    }
}

// Example 2: Using File object (from file input)
async function classifyFromFile(file: File) {
    try {
        const results = await classifyGarbage(file);

        return {
            category: results[0].label,
            confidence: results[0].score,
            allResults: results,
            recyclingInfo: getRecyclingInfo(results[0].label)
        };
    } catch (error) {
        console.error('Classification error:', error);
        return null;
    }
}

// Helper function for recycling information
function getRecyclingInfo(category: string): { canRecycle: boolean; instructions: string } {
    const recyclingGuide: Record<string, { canRecycle: boolean; instructions: string }> = {
        cardboard: {
            canRecycle: true,
            instructions: "Remove tape and flatten before placing in recycling bin"
        },
        glass: {
            canRecycle: true,
            instructions: "Clean thoroughly and place in glass recycling container"
        },
        metal: {
            canRecycle: true,
            instructions: "Rinse clean and place in metal recycling bin"
        },
        paper: {
            canRecycle: true,
            instructions: "Keep dry and place in paper recycling bin"
        },
        plastic: {
            canRecycle: true,
            instructions: "Check recycling number and clean before recycling"
        },
        trash: {
            canRecycle: false,
            instructions: "Dispose in general waste bin"
        }
    };

    return recyclingGuide[category.toLowerCase()] || {
        canRecycle: false,
        instructions: "Check local waste disposal guidelines"
    };
}

async function saveTrashData(trashData: TrashData): Promise<void> {
    try {
        const dataDir = path.join(process.cwd(), 'src', 'data');
        const filePath = path.join(dataDir, 'trash.json');

        if (!existsSync(dataDir)) {
            await mkdir(dataDir, { recursive: true })
        }

        let existingData: TrashData[] = [];

        if (existsSync(filePath)) {
            try {
                const fileContent = await readFile(filePath, "utf-8");
                existingData = JSON.parse(fileContent);
            } catch (error) {
                console.error('error reading existing trash file');
                existingData = [];
            }
        }
        existingData.push(trashData);

        if (existingData.length > 100) {
            existingData = existingData.slice(-100)
        }
        await writeFile(filePath, JSON.stringify(existingData, null, 2));
        console.log("trash save success");
    } catch (error) {
        console.error('error saving trash data:', error);
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const { filename } = await request.json();
        if (!filename) {
            return Response.json(
                { error: 'No filename provided' },
                { status: 400 }
            );
        }

        const filePath = path.join(process.cwd(), 'Camera', filename);

        // Read file as Buffer
        const fileBuffer = await readFile(filePath);

        // Create a File-like object for classifyGarbage
        const file = new File([fileBuffer], filename, { type: 'image/jpeg' });

        const results = await classifyGarbage(file);
        const topResult = results[0];
        const recyclingInfo = getRecyclingInfo(topResult.label);

        const trashData: TrashData = {
            category: topResult.label,
            timestamp: new Date().toISOString(),
            confidence: topResult.score,
            recyclingInfo: recyclingInfo,
        };
        console.log(trashData);

        try {
            await saveTrashData(trashData);
        } catch (saveError) {
            console.error(`error saving trash data but success classify: ${saveError}`);
        }

        return Response.json({
            // success: true,
            // data: {
                category: topResult.label,
                confidence: topResult.score,
                allResult: results,
                recyclingInfo: recyclingInfo,
                // saveToFile: true,
                timestamp: trashData.timestamp
            // }
        });
    } catch (error) {
        console.error('API error: ', error);
        return Response.json(
            { error: 'failed to classified image' },
            { status: 500 }
        );
    }
}

// Add GET method to retrieve saved trash data
export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'src', 'data');
        const filePath = path.join(dataDir, 'trash.json');

        // Check if file exists
        if (!existsSync(filePath)) {
            return Response.json([]);
        }

        // Read the file
        const fileContent = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        return Response.json({
            success: true,
            data: data,
            total: data.length
        });

    } catch (error) {
        console.error('Error reading trash data:', error);
        return Response.json(
            { error: 'Failed to read trash data' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { timestamp } = await request.json();
        if (!timestamp) {
            return Response.json(
                { error: 'No timestamp provided' },
                { status: 400 }
            );
        }

        const dataDir = path.join(process.cwd(), 'src', 'data');
        const filePath = path.join(dataDir, 'trash.json');

        // Check if file exists
        if (!existsSync(filePath)) {
            return Response.json(
                { error: 'No trash data found' },
                { status: 404 }
            );
        }

        // Read the file
        const fileContent = await readFile(filePath, 'utf-8');
        let data: TrashData[] = JSON.parse(fileContent);

        // Filter out the entry with the given timestamp
        data = data.filter(entry => entry.timestamp !== timestamp);

        // Write the updated data back to the file
        await writeFile(filePath, JSON.stringify(data, null, 2));

        return Response.json({
            success: true,
            message: 'Trash entry deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting trash entry:', error);
        return Response.json(
            { error: 'Failed to delete trash entry' },
            { status: 500 }
        );
    }
}

// Example usage in a React/Next.js component or Node.js app
export {
    query,
    queryWithFile,
    classifyGarbage,
    imageToBase64,
    getRecyclingInfo,
    type HuggingFaceInput,
    type ClassificationResult,
    type HuggingFaceResponse,
    type HuggingFaceError
};