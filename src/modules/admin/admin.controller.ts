import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  createBaseResponseDto,
  RateLimitSchema,
  type RateLimitSchemaType,
  UserRoleEnum,
} from 'src/utils/zod.schemas';
import { Roles } from '../auth/decorators/roles.decorator';
// FIXME: Research to fix this, instead of using every time we need better solution
// biome-ignore lint/style/useImportType: Needed for DI
import { PrometheusService } from '../monitoring/prometheus.service';
// FIXME: Research to fix this, instead of using every time we need better solution
// biome-ignore lint/style/useImportType: Needed for DI
import { AdminService } from './admin.service';
import {
  AdminDisableSuspendResponseSchema,
  type AdminDisableSuspendResponseSchemaType,
  MetricsSchema,
  type MetricsSchemaType,
  RateLimitGetSchema,
  type RateLimitGetSchemaType,
  RateLimitUpsertDto,
  SuspiciousActivityResponseSchema,
  type SuspiciousActivityResponseSchemaType,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(UserRoleEnum.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiForbiddenResponse({
  description: 'Forbidden resource',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 403 },
      message: { type: 'string', example: 'Forbidden resource' },
      timestamp: { type: 'string', example: new Date().toISOString() },
    },
  },
})
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Unauthorized' },
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
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prometheusService: PrometheusService,
  ) {}

  @Post('disable/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle disable/enable a user' })
  @ApiParam({ name: 'userId', type: 'string', description: 'User ID (uuid)' })
  @ApiOkResponse({
    type: createBaseResponseDto(
      AdminDisableSuspendResponseSchema,
      'AdminDisableSuspendResponseSchema',
    ),
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
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(AdminDisableSuspendResponseSchema)
  async adminDisable(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminDisableSuspendResponseSchemaType> {
    return this.adminService.adminDisable(userId);
  }

  @Post('suspend/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend (soft-delete) a user' })
  @ApiParam({ name: 'userId', type: 'string', description: 'User ID (uuid)' })
  @ApiOkResponse({
    type: createBaseResponseDto(
      AdminDisableSuspendResponseSchema,
      'AdminDisableSuspendResponseSchema',
    ),
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
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(AdminDisableSuspendResponseSchema)
  async adminSuspend(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminDisableSuspendResponseSchemaType> {
    return this.adminService.adminSuspend(userId);
  }

  @Get('monitoring')
  @ApiOkResponse({
    type: createBaseResponseDto(MetricsSchema, 'MetricsSchema'),
  })
  @ApiOperation({ summary: 'Get app metrics' })
  async adminMetrics(): Promise<MetricsSchemaType> {
    return {
      uploads: await this.prometheusService.getUploadsPerDay(),
      apiUsage: await this.prometheusService.getApiUsage(),
      errorRates: await this.prometheusService.getErrorRates(),
    };
  }

  @Patch('rate-limit')
  @HttpCode(200)
  @ApiOkResponse({
    type: createBaseResponseDto(RateLimitSchema, 'RateLimitSchema'),
  })
  @ApiOperation({ summary: 'Set rate limit rule' })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', example: 'limit' },
              message: { type: 'string', example: 'Required field is missing' },
              code: { type: 'string', example: 'REQUIRED' },
            },
          },
        },
        timestamp: {
          type: 'string',
          example: '2025-08-25T21:59:30.357Z',
        },
        path: { type: 'string', example: '/api/admin/rate-limit' },
      },
    },
  })
  @ApiBody({ type: RateLimitUpsertDto })
  @ZodSerializerDto(RateLimitSchema)
  async adminUpsertRateLimit(
    @Body() body: RateLimitUpsertDto,
  ): Promise<RateLimitSchemaType> {
    return this.adminService.adminUpsertRateLimit(body);
  }

  @Get('rate-limit')
  @HttpCode(200)
  @ApiOkResponse({
    type: createBaseResponseDto(RateLimitGetSchema, 'RateLimitGetSchema'),
  })
  @ApiOperation({ summary: 'Get rate limit rules' })
  @ZodSerializerDto(RateLimitGetSchema)
  async adminGetRateLimits(): Promise<RateLimitGetSchemaType> {
    return this.adminService.adminGetRateLimits();
  }

  @Get('suspicious-activities')
  @HttpCode(200)
  @ApiOkResponse({
    type: createBaseResponseDto(
      SuspiciousActivityResponseSchema,
      'SuspiciousActivityResponseSchema',
    ),
  })
  @ApiOperation({ summary: 'Get suspicious activities' })
  @ZodSerializerDto(SuspiciousActivityResponseSchema)
  async adminGetSuspiciousActivities(): Promise<SuspiciousActivityResponseSchemaType> {
    return this.adminService.adminGetSuspiciousActivities();
  }
}
