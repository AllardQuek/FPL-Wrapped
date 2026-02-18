export function createUpdateDeduper(maxProcessedUpdatesCache = 1000) {
    const processedUpdates = new Set<number>();

    return {
        shouldProcess(updateId: number) {
            if (processedUpdates.has(updateId)) {
                return false;
            }

            processedUpdates.add(updateId);

            if (processedUpdates.size > maxProcessedUpdatesCache) {
                const firstItem = processedUpdates.values().next().value;
                if (firstItem !== undefined) {
                    processedUpdates.delete(firstItem);
                }
            }

            return true;
        }
    };
}