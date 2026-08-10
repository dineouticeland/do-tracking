export declare function wasDelivered(logicalEventId: string, destination: string): boolean;
export declare function markDelivered(logicalEventId: string, destination: string): void;
export declare function pendingDestinations(logicalEventId: string | undefined, destinationPrefix: string, destinationIds: readonly string[]): string[];
export declare function markDestinationsDelivered(logicalEventId: string | undefined, destinationPrefix: string, destinationIds: readonly string[]): void;
/** Internal test helper; not re-exported from the package root. */
export declare function __resetDeduplicationForTests(): void;
//# sourceMappingURL=deduplication.d.ts.map