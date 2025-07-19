// TypeScript interfaces for Hugging Face Garbage Classification API

import { error } from "console";

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

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return Response.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!file.type.startsWith('image/')) {
            return Response.json(
                { error: 'file must be an image' },
                { status: 400 }
            );
        }

        const results = await classifyGarbage(file);

        const topResult = results[0];
        const recyclingInfo = getRecyclingInfo(topResult.label);
        return Response.json({
            success: true,
            data: {
                category: topResult.label,
                confidence: topResult.score,
                allResult: results,
                recyclingInfo: recyclingInfo
            }
        });
    } catch (error) {
        console.error('API error: ', error);
        return Response.json(
            { error: 'failed to classified image' },
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