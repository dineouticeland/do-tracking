const STORAGE_PREFIX = 'do_tracking:v2:delivered:';
const deliveredInMemory = new Set<string>();

function deliveryKey(logicalEventId: string, destination: string): string {
    return `${logicalEventId}::${destination}`;
}

function storageKey(key: string): string {
    return `${STORAGE_PREFIX}${encodeURIComponent(key)}`;
}

export function wasDelivered(logicalEventId: string, destination: string): boolean {
    const key = deliveryKey(logicalEventId, destination);
    if (deliveredInMemory.has(key)) return true;

    try {
        if (typeof window !== 'undefined' && window.sessionStorage?.getItem(storageKey(key)) === '1') {
            deliveredInMemory.add(key);
            return true;
        }
    } catch {
        // Storage may be unavailable in privacy modes. Memory dedup still applies.
    }

    return false;
}

export function markDelivered(logicalEventId: string, destination: string): void {
    const key = deliveryKey(logicalEventId, destination);
    deliveredInMemory.add(key);

    try {
        if (typeof window !== 'undefined') {
            window.sessionStorage?.setItem(storageKey(key), '1');
        }
    } catch {
        // A blocked storage write must not prevent analytics delivery.
    }
}

export function pendingDestinations(
    logicalEventId: string | undefined,
    destinationPrefix: string,
    destinationIds: readonly string[],
): string[] {
    if (!logicalEventId) return [...destinationIds];
    return destinationIds.filter((id) => !wasDelivered(logicalEventId, `${destinationPrefix}:${id}`));
}

export function markDestinationsDelivered(
    logicalEventId: string | undefined,
    destinationPrefix: string,
    destinationIds: readonly string[],
): void {
    if (!logicalEventId) return;
    destinationIds.forEach((id) => markDelivered(logicalEventId, `${destinationPrefix}:${id}`));
}

/** Internal test helper; not re-exported from the package root. */
export function __resetDeduplicationForTests(): void {
    deliveredInMemory.clear();
}
