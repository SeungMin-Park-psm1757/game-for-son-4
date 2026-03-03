import { PetStats } from './fsm';
import { get, set, del } from 'idb-keyval';

export interface SavedState {
    stats: PetStats;
    lastTick: number;
    isObese?: boolean;
    careMisses: number;
}

const STORAGE_KEY = 'mlb.save.v1';
const OLD_STORAGE_KEY = 'my-little-brachio-save';

export class StorageManager {
    public static async save(stats: PetStats, lastTick: number, careMisses: number = 0) {
        const data: SavedState = { stats, lastTick, careMisses };
        await set(STORAGE_KEY, data).catch(e => console.error('IDB Backup failed', e));
    }

    public static async load(): Promise<SavedState | null> {
        try {
            const data = await get<SavedState>(STORAGE_KEY);
            if (data) {
                // Migration logic for old states using 'coin'
                const oldStats = data.stats as any;
                if (oldStats.gold === undefined) {
                    oldStats.gold = oldStats.coin !== undefined ? oldStats.coin : 0;
                }
                return data;
            }
        } catch (e) {
            console.error('IDB load failed', e);
        }

        // Migration from old synchronous localStorage
        const oldDataStr = localStorage.getItem(OLD_STORAGE_KEY);
        if (oldDataStr) {
            try {
                const oldData = JSON.parse(oldDataStr) as SavedState;
                const oldStats = oldData.stats as any;
                if (oldStats.gold === undefined) {
                    oldStats.gold = oldStats.coin !== undefined ? oldStats.coin : 0;
                }
                await set(STORAGE_KEY, oldData); // migrate!
                localStorage.removeItem(OLD_STORAGE_KEY); // clear old
                return oldData;
            } catch (e) {
                console.error('Failed to parse old saved state', e);
            }
        }
        return null; // Both empty
    }

    public static async clear() {
        await del(STORAGE_KEY);
    }
}
