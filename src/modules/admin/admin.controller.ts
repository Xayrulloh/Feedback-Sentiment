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
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { createBaseResponseDto } from 'src/helpers/create-base-response.helper';
import {
  RateLimitSchema,
  type RateLimitSchemaType,
  UserRoleEnum,
} from 'src/utils/zod.schemas';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrometheusService } from '../monitoring/prometheus.service';
import { AdminService } from './admin.service';
import {
  AdminDisableSuspendResponseDto,
  AdminDisableSuspendResponseSchema,
  MetricsDto,
  MetricsSchema,
  RateLimitGetDto,
  RateLimitGetSchema,
  RateLimitUpsertDto,
  SuspiciousActivityResponseDto,
  SuspiciousActivityResponseSchema,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(UserRoleEnum.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard, RateLimitGuard)
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
  @ApiOperation({ summary: 'Disable a user' })
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
          example: new Date().toISOString(),
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
  ): Promise<AdminDisableSuspendResponseDto> {
    return this.adminService.adminDisable(userId);
  }

  @Post('suspend/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle to suspend a user' })
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
          example: new Date().toISOString(),
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
  ): Promise<AdminDisableSuspendResponseDto> {
    return this.adminService.adminSuspend(userId);
  }

  @Get('metrics')
  @ApiOkResponse({
    type: createBaseResponseDto(MetricsSchema, 'MetricsSchema'),
  })
  @ApiOperation({ summary: 'Get app metrics' })
  async adminMetrics(): Promise<MetricsDto> {
    return {
      uploads: await this.prometheusService.getUploadsPerDay(),
      apiUsage: await this.prometheusService.getApiUsage(),
      errorRates: await this.prometheusService.getErrorRates(),
    };
  }

  @Patch('rate-limit')
  @HttpCode(HttpStatus.OK)
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
          example: new Date().toISOString(),
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
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: createBaseResponseDto(RateLimitGetSchema, 'RateLimitGetSchema'),
  })
  @ApiOperation({ summary: 'Get rate limit rules' })
  @ZodSerializerDto(RateLimitGetSchema)
  async adminGetRateLimits(): Promise<RateLimitGetDto> {
    return this.adminService.adminGetRateLimits();
  }

  @Get('suspicious-activities')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: createBaseResponseDto(
      SuspiciousActivityResponseSchema,
      'SuspiciousActivityResponseSchema',
    ),
  })
  @ApiOperation({ summary: 'Get suspicious activities' })
  @ZodSerializerDto(SuspiciousActivityResponseSchema)
  async adminGetSuspiciousActivities(): Promise<SuspiciousActivityResponseDto> {
    return this.adminService.adminGetSuspiciousActivities();
  }
}
