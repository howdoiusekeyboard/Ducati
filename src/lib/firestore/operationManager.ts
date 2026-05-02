// src/lib/firestore/operationManager.ts
import { connectionManager } from './connectionManager';

interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
    timeoutMs: number;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export class FirestoreOperationManager {
    private static instance: FirestoreOperationManager;
    private cache = new Map<string, CacheEntry<any>>();
    private pendingOperations = new Map<string, Promise<any>>();

    private defaultRetryConfig: RetryConfig = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        timeoutMs: 15000
    };

    private constructor() {
        this.startCacheCleanup();
    }

    public static getInstance(): FirestoreOperationManager {
        if (!FirestoreOperationManager.instance) {
            FirestoreOperationManager.instance = new FirestoreOperationManager();
        }
        return FirestoreOperationManager.instance;
    }

    private startCacheCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of Array.from(this.cache.entries())) {
                if (now > entry.expiresAt) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // Clean up every minute
    }

    public async executeOperation<T>(
        operationId: string,
        operation: () => Promise<T>,
        config: Partial<RetryConfig> = {},
        cacheTTL: number = 0
    ): Promise<T> {
        // Check cache first
        if (cacheTTL > 0) {
            const cached = this.getFromCache<T>(operationId);
            if (cached !== null) {
                return cached;
            }
        }

        // Check if operation is already pending
        const pending = this.pendingOperations.get(operationId);
        if (pending) {
            return pending;
        }

        // Execute operation with retry logic
        const promise = this.executeWithRetry(operation, { ...this.defaultRetryConfig, ...config });
        this.pendingOperations.set(operationId, promise);

        try {
            const result = await promise;

            // Cache result if TTL specified
            if (cacheTTL > 0) {
                this.setCache(operationId, result, cacheTTL);
            }

            return result;
        } finally {
            this.pendingOperations.delete(operationId);
        }
    }

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        config: RetryConfig
    ): Promise<T> {
        let lastError: any;
        let delay = config.initialDelay;

        for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
            try {
                // Ensure connection before attempting operation
                const isConnected = await connectionManager.ensureConnection();
                if (!isConnected && attempt === config.maxRetries) {
                    throw new Error('Unable to establish Firestore connection');
                }

                // Execute operation with timeout
                const result = await this.withTimeout(operation(), config.timeoutMs);
                return result;
            } catch (error: any) {
                lastError = error;
                console.error(`Operation attempt ${attempt}/${config.maxRetries} failed:`, error);

                // Check if error is retryable
                if (!this.isRetryableError(error) || attempt === config.maxRetries) {
                    throw error;
                }

                // Wait before retrying
                await this.delay(delay);
                delay = Math.min(delay * config.backoffFactor, config.maxDelay);
            }
        }

        throw lastError;
    }

    private isRetryableError(error: any): boolean {
        const retryableCodes = ['unavailable', 'deadline-exceeded', 'internal', 'unknown'];
        const retryableMessages = ['transport', 'network', 'connection', 'timeout', 'ENOTFOUND', 'ECONNREFUSED'];

        return (
            retryableCodes.includes(error?.code) ||
            retryableMessages.some(msg => error?.message?.toLowerCase()?.includes(msg))
        );
    }

    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getFromCache<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    private setCache<T>(key: string, data: T, ttlMs: number): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttlMs
        });
    }

    public clearCache(pattern?: string): void {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        this.cache.forEach((_, key) => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
}

export const operationManager = FirestoreOperationManager.getInstance();