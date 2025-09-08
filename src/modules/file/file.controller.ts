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
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserStatusGuard } from 'src/common/guards/user-status.guard';
import { createBaseResponseDto } from 'src/helpers/create-base-response.helper';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import { UserRoleEnum } from 'src/utils/zod.schemas';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  FileQueryDto,
  FileResponseDto,
  FileResponseSchema,
} from './dto/file.dto';
import { FileService } from './file.service';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard, RateLimitGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
@ApiForbiddenResponse({
  description: 'Forbidden - user is suspended',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 403 },
      message: {
        type: 'string',
        example: 'User account is suspended',
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
@Controller('workspaces')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(['file/all', ':workspaceId/file'])
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiParam({
    name: 'workspaceId',
    type: 'string',
    required: false,
    description:
      'Workspace ID (uuid). If omitted, returns all grouped feedbacks from all workspaces.',
  })
  @ApiOkResponse({
    type: createBaseResponseDto(FileResponseSchema, 'FileResponseSchema'),
  })
  @ZodSerializerDto(FileResponseSchema)
  @ApiOperation({
    summary: 'Get all user files based',
  })
  async getFile(
    @Param('workspaceId') workspaceId: string | undefined,
    @Query(new ZodValidationPipe(FileQueryDto))
    query: FileQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FileResponseDto> {
    return this.fileService.getFile(query, req.user, workspaceId);
  }

  @Delete(':fileId')
  @ApiParam({ name: 'fileId', type: 'string', description: 'File ID (uuid)' })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'OK',
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
