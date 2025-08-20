import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
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
@ApiForbiddenResponse({
  description: 'Forbidden - user is disabled or suspended',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 403 },
      message: { type: 'string', example: 'User account is disabled' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', example: 'user' },
            message: { type: 'string', example: 'User is suspended' },
            code: { type: 'string', example: 'USER_SUSPENDED' },
          },
        },
        example: [
          {
            field: 'user',
            message: 'User is suspended',
            code: 'USER_SUSPENDED',
          },
        ],
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
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Token is invalid or expired' },
            code: { type: 'string', example: 'INVALID_TOKEN' },
          },
        },
        example: [
          { message: 'Token is invalid or expired', code: 'INVALID_TOKEN' },
        ],
      },
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
      errors: [
        {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      ],
      timestamp: new Date().toISOString(),
    },
  },
})
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
  async getUserFiles(
    @Query(new ZodValidationPipe(FileQueryDto))
    query: FileQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.fileService.getUserFiles(query, req.user);
  }
}
