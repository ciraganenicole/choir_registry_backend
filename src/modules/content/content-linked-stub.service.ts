import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type LinkedStubRow = { id: number; label: string };

@Injectable()
export class ContentLinkedStubService {
  constructor(private readonly dataSource: DataSource) {}

  async listAlbums(): Promise<LinkedStubRow[]> {
    const rows: { id: number; label: string }[] = await this.dataSource.query(
      `SELECT id, label FROM albums ORDER BY id ASC`,
    );
    return rows.map((r) => ({
      id: Number(r.id),
      label: r.label ?? '',
    }));
  }

  async listPlaylists(): Promise<LinkedStubRow[]> {
    const rows: { id: number; label: string }[] = await this.dataSource.query(
      `SELECT id, label FROM playlists ORDER BY id ASC`,
    );
    return rows.map((r) => ({
      id: Number(r.id),
      label: r.label ?? '',
    }));
  }

  async createAlbum(label?: string): Promise<LinkedStubRow> {
    const rows: { id: number; label: string }[] = await this.dataSource.query(
      `INSERT INTO albums (label) VALUES ($1) RETURNING id, label`,
      [label?.trim() ?? ''],
    );
    const r = rows[0];
    return { id: Number(r.id), label: r.label ?? '' };
  }

  async createPlaylist(label?: string): Promise<LinkedStubRow> {
    const rows: { id: number; label: string }[] = await this.dataSource.query(
      `INSERT INTO playlists (label) VALUES ($1) RETURNING id, label`,
      [label?.trim() ?? ''],
    );
    const r = rows[0];
    return { id: Number(r.id), label: r.label ?? '' };
  }
}
