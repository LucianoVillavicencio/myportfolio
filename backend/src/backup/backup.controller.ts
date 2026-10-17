import {
  Controller,
  Get,
  Header,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { DataSource } from "typeorm";
import type { SqljsDriver } from "typeorm/driver/sqljs/SqljsDriver";
import { AdminKeyGuard } from "../common/admin-key.guard";

@Controller("backup")
@UseGuards(AdminKeyGuard)
export class BackupController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @Header("Content-Type", "application/vnd.sqlite3")
  @Header("Cache-Control", "no-store")
  download(@Res({ passthrough: true }) res: Response): StreamableFile {
    const data = (this.dataSource.driver as SqljsDriver).export();
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="portfolio-${date}.sqlite"`,
    );
    return new StreamableFile(data);
  }
}
