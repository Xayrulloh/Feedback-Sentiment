import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
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
import { UserStatusGuard } from 'src/common/guards/user-status.guard';
import { createBaseResponseDto } from 'src/helpers/create-base-response.helper';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import {
  WorkspaceQueryDto,
  WorkspaceRequestDto,
  WorkspaceResponseDto,
  WorkspaceResponseSchema,
  WorkspaceSchema,
  WorkspaceSingleResponseDto,
} from './dto/workspace.dto';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, UserStatusGuard, RateLimitGuard)
@ApiBearerAuth()
@ApiTags('Workspaces')
@ApiForbiddenResponse({
  description: 'Forbidden - user is suspended',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 403 },
      message: { type: 'string', example: 'User account is suspended' },
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
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: WorkspaceRequestDto })
  @ZodSerializerDto(WorkspaceSchema)
  @ApiOperation({ summary: 'Create a workspace' })
  @ApiCreatedResponse({
    type: createBaseResponseDto(WorkspaceSchema, 'WorkspaceSchema'),
  })
  @ApiBadRequestResponse({
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            field: 'name',
            message: 'Name is required',
            code: 'REQUIRED',
          },
        ],
        path: '/workspaces',
        timestamp: new Date().toISOString(),
      },
    },
  })
  create(
    @Body() workspaceRequestDto: WorkspaceRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<WorkspaceSingleResponseDto> {
    return this.workspaceService.create(workspaceRequestDto, req.user.id);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get all workspaces' })
  @ApiOkResponse({
    type: createBaseResponseDto(
      WorkspaceResponseSchema,
      'WorkspaceResponseSchema',
    ),
  })
  @ZodSerializerDto(WorkspaceResponseSchema)
  findAll(
    @Query(new ZodValidationPipe(WorkspaceQueryDto))
    query: WorkspaceQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.findAll(query, req.user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string', description: 'Workspace ID (uuid)' })
  @ApiOperation({ summary: 'Get a workspace by ID' })
  @ApiOkResponse({
    type: createBaseResponseDto(WorkspaceSchema, 'WorkspaceSchema'),
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
    description: 'Workspace not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Workspace not found' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(WorkspaceSchema)
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<WorkspaceSingleResponseDto> {
    return this.workspaceService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: 'string', description: 'Workspace ID (uuid)' })
  @ApiOperation({ summary: 'Update a workspace by ID' })
  @ApiOkResponse({
    type: createBaseResponseDto(WorkspaceSchema, 'WorkspaceSchema'),
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
    description: 'Workspace not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Workspace not found' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(WorkspaceSchema)
  update(
    @Param('id') id: string,
    @Body() workspaceRequestDto: WorkspaceRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workspaceService.update(id, req.user.id, workspaceRequestDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: 'string', description: 'Workspace ID (uuid)' })
  @ApiOperation({ summary: 'Delete a workspace by ID' })
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
    description: 'Workspace not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Workspace not found' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.workspaceService.remove(id, req.user.id);
  }
}
