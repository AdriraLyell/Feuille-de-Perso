/**
 * ImageCompressionService
 * 
 * Compresses images for efficient storage in database.
 * - Step 1: JPEG compression + resize (preserving aspect ratio)
 * - Step 2: gzip compression of base64 string
 * Total gain: 70-85% size reduction
 */

import pako from 'pako';
import { ErrorService } from './ErrorService';

export interface CompressionResult {
    compressed: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

export const ImageCompressionService = {

    /**
     * Compress an image (base64) with JPEG quality reduction and resize.
     * Preserves aspect ratio - only resizes if width > maxWidth.
     * 
     * @param base64 - Image in base64 format (data:image/...)
     * @param quality - JPEG quality (0-1), default 0.85
     * @param maxWidth - Maximum width in pixels, default 1920
     * @returns Compressed base64 image
     */
    async compressImage(
        base64: string,
        quality: number = 0.85,
        maxWidth: number = 1920
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            // Create image element
            const img = new Image();

            img.onload = () => {
                try {
                    // Calculate new dimensions preserving aspect ratio
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        const ratio = maxWidth / width;
                        width = maxWidth;
                        height = Math.round(height * ratio);
                    }

                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to JPEG with quality setting
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                } catch (e) {
                    reject(e);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = base64;
        });
    },

    /**
     * Compress a base64 string using gzip (lossless).
     * 
     * @param base64 - Base64 string to compress
     * @returns Compressed base64 string with marker
     */
    compressBase64(base64: string): string {
        try {
            // Remove data URL prefix if present
            const base64Data = base64.includes(',')
                ? base64.split(',')[1]
                : base64;

            // Convert base64 to binary
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Compress with pako (gzip)
            const compressed = pako.gzip(bytes);

            // Convert back to base64
            const compressedBase64 = btoa(
                String.fromCharCode.apply(null, Array.from(compressed))
            );

            // Add marker to identify compressed data
            return `GZIP:${compressedBase64}`;
        } catch (e) {
            ErrorService.handleError(e, { context: 'ImageCompressionService.compressBase64', silent: true });
            return base64; // Return original on error
        }
    },

    /**
     * Decompress a gzip-compressed base64 string.
     * 
     * @param compressed - Compressed string with GZIP: marker
     * @returns Original base64 string
     */
    decompressBase64(compressed: string): string {
        try {
            // Check if data is compressed
            if (!compressed.startsWith('GZIP:')) {
                return compressed; // Not compressed, return as-is
            }

            // Remove marker
            const compressedData = compressed.substring(5);

            // Convert base64 to binary
            const binaryString = atob(compressedData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Decompress with pako
            const decompressed = pako.ungzip(bytes);

            // Convert back to base64
            return btoa(
                String.fromCharCode.apply(null, Array.from(decompressed))
            );
        } catch (e) {
            ErrorService.handleError(e, { context: 'ImageCompressionService.decompressBase64', silent: true });
            return compressed; // Return original on error
        }
    },

    /**
     * Full compression pipeline: Image compression + gzip.
     * 
     * @param base64 - Original image base64
     * @param quality - JPEG quality (0-1)
     * @param maxWidth - Maximum width
     * @returns Compression result with stats
     */
    async compressFull(
        base64: string,
        quality: number = 0.85,
        maxWidth: number = 1920
    ): Promise<CompressionResult> {
        const originalSize = base64.length;

        // Step 1: Image compression
        const imageCompressed = await this.compressImage(base64, quality, maxWidth);

        // Step 2: gzip compression
        const fullyCompressed = this.compressBase64(imageCompressed);

        const compressedSize = fullyCompressed.length;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

        return {
            compressed: fullyCompressed,
            originalSize,
            compressedSize,
            compressionRatio
        };
    },

    /**
     * Decompress data from full compression pipeline.
     * 
     * @param compressed - Fully compressed data
     * @returns Decompressed base64 image
     */
    decompressFull(compressed: string): string {
        // Only need to decompress gzip layer
        // Image compression is lossy and permanent
        return this.decompressBase64(compressed);
    },

    /**
     * Recursively process an object to compress/decompress image strings.
     * Moves this logic from CharacterSyncService to be reusable.
     */
    async processImages(obj: any, action: 'compress' | 'decompress'): Promise<any> {
        if (!obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => this.processImages(item, action)));
        }

        const processed: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                if (action === 'compress' && value.startsWith('data:image/')) {
                    const result = await this.compressFull(value);
                    processed[key] = result.compressed;
                } else if (action === 'compress' && value.startsWith('GZIP:')) {
                    // ALREADY COMPRESSED - SKIP to avoid generation loss
                    processed[key] = value;
                } else if (action === 'decompress' && value.startsWith('GZIP:')) {
                    processed[key] = this.decompressFull(value);
                } else {
                    processed[key] = value;
                }
            } else if (typeof value === 'object') {
                processed[key] = await this.processImages(value, action);
            } else {
                processed[key] = value;
            }
        }
        return processed;
    }
};
