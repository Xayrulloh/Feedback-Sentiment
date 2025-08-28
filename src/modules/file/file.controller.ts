import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserStatusGuard } from 'src/common/guards/user-status.guard';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import { createBaseResponseDto, UserRoleEnum } from 'src/utils/zod.schemas';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  FileQueryDto,
  FileResponseDto,
  FileResponseSchema,
} from './dto/file.dto';
// FIXME: Research to fix this, instead of using every time we need better solution
// biome-ignore lint/style/useImportType: Needed for DI
import { FileService } from './file.service';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
@ApiForbiddenResponse({
  description: 'Forbidden - user is disabled or suspended',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 403 },
      message: {
        type: 'string',
        example: 'User account is disabled or suspended',
      },
      timestamp: { type: 'string', example: new Date().toISOString() },
    },
  },
})
@ApiUnauthorizedResponse({
  description: 'Unauthorized - JWT missing or invalid',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Invalid or expired token' },
      timestamp: { type: 'string', example: new Date().toISOString() },
    },
  },
})
@ApiInternalServerErrorResponse({
  schema: {
    example: {
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    },
  },
})
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  // FIXME: no need api bearer auth since we already gave it in controller layer
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: createBaseResponseDto(FileResponseSchema, 'FileResponseSchema'),
  })
  @ZodSerializerDto(FileResponseDto)
  @ApiOperation({
    summary: 'Get all user files',
  })
  async getFile(
    @Query(new ZodValidationPipe(FileQueryDto))
    query: FileQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FileResponseDto> {
    return this.fileService.getFile(query, req.user);
  }

  @Delete(':fileId')
  // FIXME: no need api bearer auth since we already gave it in controller layer
  @ApiBearerAuth()
  @ApiParam({ name: 'fileId', type: 'string', description: 'File ID (uuid)' })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'File and related feedbacks deleted successfully',
        path: '/api/files/{fileId}',
      },
    },
  })
  @ApiNotFoundResponse({
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message: 'File not found',
        path: '/api/files/{fileId}',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed (uuid is expected)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Validation failed (uuid is expected)',
        },
        timestamp: {
          type: 'string',
          example: '2025-08-26T22:15:00.000Z',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Delete a file and all its feedbacks',
  })
  async fileDelete(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fileService.fileDelete(fileId, req.user);
  }
}
