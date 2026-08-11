import { eq } from 'drizzle-orm';
import type { SystemSettingsResponse, SystemSettingsPayload } from '@oklychee/prism-shared';
import { Database } from '../db';
import { systemSettings } from '../db/schema';

export class SettingsService {
  constructor(private db: Database) {}

  async getAllSettings(): Promise<Record<string, string>> {
    const results = await this.db.select({ key: systemSettings.key, value: systemSettings.value }).from(systemSettings);

    const settings: Record<string, string> = {};
    if (results) {
      for (const row of results) {
        settings[row.key] = row.value;
      }
    }
    return settings;
  }

  async getSetting(key: string): Promise<string | null> {
    const [row] = await this.db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    return row ? row.value : null;
  }

  async saveSettings(settings: SystemSettingsPayload): Promise<void> {
    const now = Date.now();
    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined) continue;
      await this.db
        .insert(systemSettings)
        .values({
          key,
          value,
          updated_at: now,
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value,
            updated_at: now,
          },
        });
    }
  }
}
