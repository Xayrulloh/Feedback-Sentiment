import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { createBaseResponseDto } from 'src/helpers/create-base-response.helper';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceQueryDto,
  WorkspaceResponseSchema,
  WorkspaceSchema,
} from './dto/workspace.dto';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @ZodSerializerDto(WorkspaceSchema)
  @ApiOperation({ summary: 'Create a workspace' })
  @ApiOkResponse({
    type: createBaseResponseDto(WorkspaceSchema, 'WorkspaceSchema'),
  })
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    createWorkspaceDto.userId = req.user.id;

    return this.workspaceService.create(createWorkspaceDto);
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
  ) {
    return this.workspaceService.findAll(query, req.user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string', description: 'Workspace ID (uuid)' })
  @ApiOperation({ summary: 'Get a workspace by ID' })
  @ApiOkResponse({
    type: createBaseResponseDto(WorkspaceSchema, 'WorkspaceSchema'),
  })
  @ZodSerializerDto(WorkspaceSchema)
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.workspaceService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: 'string', description: 'Workspace ID (uuid)' })
  @ApiOperation({ summary: 'Update a workspace by ID' })
  @ApiOkResponse({
    type: createBaseResponseDto(WorkspaceSchema, 'WorkspaceSchema'),
  })
  @ZodSerializerDto(WorkspaceSchema)
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workspaceService.update(id, req.user.id, updateWorkspaceDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string', description: 'Workspace ID (uuid)' })
  @ApiOperation({ summary: 'Delete a workspace by ID' })
  @ZodSerializerDto(WorkspaceSchema)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.workspaceService.remove(id, req.user.id);
  }
}
