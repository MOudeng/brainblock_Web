// Target block patterns for each variant
// Each array represents the 4 block faces in the order: Top-Left, Bottom-Left, Top-Right, Bottom-Right
// Based on NORMAL_PATTERN = False from original main.py
export const LEVEL_ANSWERS = {
    '1a': [1,2,1,2], '1b': [2,1,2,1], '1c': [2,1,1,2], '1d': [1,2,2,1],
    '2a': [2,4,1,1], '2b': [1,6,2,2], '2c': [1,2,2,4], '2d': [2,1,1,6],
    '3a': [4,1,5,1], '3b': [6,2,3,2], '3c': [5,1,4,1], '3d': [3,2,6,2],
    '4a': [4,1,1,6], '4b': [6,2,2,4], '4c': [1,5,3,1], '4d': [2,3,5,2],
    '5a': [4,3,5,6], '5b': [6,5,3,4], '5c': [6,6,6,6], '5d': [4,4,4,4],
    '6a': [5,3,4,6], '6b': [3,5,6,4], '6c': [6,6,4,4], '6d': [4,4,6,6],
    '7a': [3,4,6,5], '7b': [5,6,4,3], '7c': [3,6,4,5], '7d': [5,4,6,3],
    '8a': [5,4,4,5], '8b': [3,6,6,3], '8c': [4,5,3,6], '8d': [6,3,5,4],
};

// Available variants for each level number
export const LEVEL_VARIANTS = {
    1: ['1a', '1b', '1c', '1d'],
    2: ['2a', '2b', '2c', '2d'],
    3: ['3a', '3b', '3c', '3d'],
    4: ['4a', '4b', '4c', '4d'],
    5: ['5a', '5b', '5c', '5d'],
    6: ['6a', '6b', '6c', '6d'],
    7: ['7a', '7b', '7c', '7d'],
    8: ['8a', '8b', '8c', '8d']
};

/**
 * Sorts the detected block faces into the correct order (TL, BL, TR, BR)
 * @param {Array<{x, y, face}>} facesFound - Array of objects with x, y coords and the detected face number
 * @returns {Array<number>} - Sorted array of face numbers matching LEVEL_ANSWERS structure
 */
export function sortBlocksForComparison(facesFound) {
    if (facesFound.length !== 4) return [];

    // Sort by X to determine left/right columns
    const sortedByX = [...facesFound].sort((a, b) => a.x - b.x);
    
    // Find midpoint between the 2nd and 3rd blocks (index 1 and 2)
    const midPoint = (sortedByX[1].x + sortedByX[2].x) / 2;

    // Group into Left and Right based on midpoint, then sort by Y (Top to Bottom)
    const sortedBlocks = [...facesFound].sort((a, b) => {
        const aIsRight = a.x >= midPoint;
        const bIsRight = b.x >= midPoint;
        
        if (aIsRight !== bIsRight) {
            return aIsRight ? 1 : -1; // Left group comes first (false < true)
        }
        
        // If in same group, sort by Y (smaller Y is Top)
        return a.y - b.y;
    });

    return sortedBlocks.map(block => block.face);
}
