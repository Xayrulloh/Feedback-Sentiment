import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { createBaseResponseDto, UserRoleEnum } from 'src/utils/zod.schemas';
import { Roles } from '../auth/decorators/roles.decorator';
// biome-ignore lint/style/useImportType: Needed for DI
import { PrometheusService } from '../monitoring/prometheus.service';
// biome-ignore lint/style/useImportType: Needed for DI
import { AdminService } from './admin.service';
import {
  AdminDisableSuspendResponseSchema,
  type AdminDisableSuspendResponseSchemaType,
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
      timestamp: { type: 'string', example: new Date().toISOString() },
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
  @ApiOperation({ summary: 'Toggle disable/enable a user (admin only)' })
  @ApiParam({ name: 'userId', type: 'string', description: 'User ID (uuid)' })
  @ApiOkResponse({
    type: createBaseResponseDto(
      AdminDisableSuspendResponseSchema,
      'AdminDisableSuspendResponseSchema',
    ),
  })
  @ZodSerializerDto(AdminDisableSuspendResponseSchema)
  async adminDisable(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminDisableSuspendResponseSchemaType> {
    return this.adminService.adminDisable(userId);
  }

  @Post('suspend/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend (soft-delete) a user (admin only)' })
  @ApiParam({ name: 'userId', type: 'string', description: 'User ID (uuid)' })
  @ApiOkResponse({
    type: createBaseResponseDto(
      AdminDisableSuspendResponseSchema,
      'AdminDisableSuspendResponseSchema',
    ),
  })
  @ZodSerializerDto(AdminDisableSuspendResponseSchema)
  async adminSuspend(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminDisableSuspendResponseSchemaType> {
    return this.adminService.adminSuspend(userId);
  }

  @Get('monitoring')
  async getAllMetrics() {
    return {
      uploads: await this.prometheusService.getUploadsPerDay(),
      apiUsage: await this.prometheusService.getApiUsage(),
      errorRates: await this.prometheusService.getErrorRates(),
    };
  }
}
