import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import { createBaseResponseDto, UserRoleEnum } from 'src/utils/zod.schemas';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  FileQueryDto,
  FileResponseDto,
  FileResponseSchema,
} from './dto/file.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { FileService } from './file.service';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: createBaseResponseDto(FileResponseSchema, 'FileResponseSchema'),
  })
  @ZodSerializerDto(FileResponseDto)
  @ApiOperation({
    summary: 'Getting all files',
  })
  @ZodSerializerDto(FileResponseSchema)
  async getUserFiles(
    @Query(new ZodValidationPipe(FileQueryDto))
    query: FileQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fileService.getUserFiles(query, req.user);
  }
}
