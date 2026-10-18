import {
  Controller,
  Get,
  Header,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import { zipSync } from "fflate";
import { promises as fs } from "fs";
import { join, resolve } from "path";
import type { Response } from "express";
import { DataSource } from "typeorm";
import type { SqljsDriver } from "typeorm/driver/sqljs/SqljsDriver";
import { resolveCvDir } from "../config";
import { AdminKeyGuard } from "../common/admin-key.guard";
import { MediaService } from "../media/media.service";

/** Adds every regular file of `dir` to `out` under `prefix/`; a missing dir is skipped. */
async function addDir(
  out: Record<string, Uint8Array>,
  dir: string,
  prefix: string,
  accept: (name: string) => boolean,
): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !accept(entry.name)) continue;
    out[`${prefix}/${entry.name}`] = new Uint8Array(
      await fs.readFile(join(dir, entry.name)),
    );
  }
}

@Controller("backup")
@UseGuards(AdminKeyGuard)
export class BackupController {
  private readonly cvDir = resolve(resolveCvDir(process.env));

  constructor(
    private readonly dataSource: DataSource,
    private readonly media: MediaService,
  ) {}

  @Get()
  @Header("Content-Type", "application/zip")
  @Header("Cache-Control", "no-store")
  async download(
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const files: Record<string, Uint8Array> = {
      "portfolio.sqlite": (this.dataSource.driver as SqljsDriver).export(),
    };
    await addDir(files, this.cvDir, "cv", (n) => n.endsWith(".pdf"));
    await addDir(files, this.media.dir, "media", (n) => !n.endsWith(".tmp"));
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="portfolio-${date}.zip"`,
    );
    // Images and PDFs are already compressed; level 0 keeps this cheap.
    return new StreamableFile(zipSync(files, { level: 0 }));
  }
}
