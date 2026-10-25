import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { BackupController } from "./backup.controller";

@Module({ imports: [MediaModule], controllers: [BackupController] })
export class BackupModule {}
