const STORAGE_PREFIX = 'do_tracking:v2:delivered:';
const deliveredInMemory = new Set();
function deliveryKey(logicalEventId, destination) {
    return `${logicalEventId}::${destination}`;
}
function storageKey(key) {
    return `${STORAGE_PREFIX}${encodeURIComponent(key)}`;
}
export function wasDelivered(logicalEventId, destination) {
    var _a;
    const key = deliveryKey(logicalEventId, destination);
    if (deliveredInMemory.has(key))
        return true;
    try {
        if (typeof window !== 'undefined' && ((_a = window.sessionStorage) === null || _a === void 0 ? void 0 : _a.getItem(storageKey(key))) === '1') {
            deliveredInMemory.add(key);
            return true;
        }
    }
    catch (_b) {
        // Storage may be unavailable in privacy modes. Memory dedup still applies.
    }
    return false;
}
export function markDelivered(logicalEventId, destination) {
    var _a;
    const key = deliveryKey(logicalEventId, destination);
    deliveredInMemory.add(key);
    try {
        if (typeof window !== 'undefined') {
            (_a = window.sessionStorage) === null || _a === void 0 ? void 0 : _a.setItem(storageKey(key), '1');
        }
    }
    catch (_b) {
        // A blocked storage write must not prevent analytics delivery.
    }
}
export function pendingDestinations(logicalEventId, destinationPrefix, destinationIds) {
    if (!logicalEventId)
        return [...destinationIds];
    return destinationIds.filter((id) => !wasDelivered(logicalEventId, `${destinationPrefix}:${id}`));
}
export function markDestinationsDelivered(logicalEventId, destinationPrefix, destinationIds) {
    if (!logicalEventId)
        return;
    destinationIds.forEach((id) => markDelivered(logicalEventId, `${destinationPrefix}:${id}`));
}
/** Internal test helper; not re-exported from the package root. */
export function __resetDeduplicationForTests() {
    deliveredInMemory.clear();
}
//# sourceMappingURL=deduplication.js.map