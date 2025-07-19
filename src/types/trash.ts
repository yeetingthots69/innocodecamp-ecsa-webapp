export type TrashData = {
    timestamp: string;
    category: string;
    confidence: number;
    recyclingInfo: {
        canRecycle: boolean;
        instructions: string;
    }
}