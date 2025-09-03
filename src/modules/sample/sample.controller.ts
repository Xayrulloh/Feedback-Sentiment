import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { createBaseResponseDto } from 'src/helpers/create-base-response.helper';
import {
  FeedbackFilteredResponseDto,
  FeedbackFilteredResponseSchema,
  FeedbackGroupedArrayResponseDto,
  FeedbackGroupedArrayResponseSchema,
  FeedbackQueryDto,
  FeedbackResponseSchema,
  FeedbackSummaryResponseDto,
  FeedbackSummaryResponseSchema,
  SentimentEnum,
} from '../feedback/dto/feedback.dto';
import { SampleService } from './sample.service';

@Controller('sample')
@ApiTags('Sample')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Forbidden resource' },
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
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Get('feedback/filtered')
  @ApiQuery({
    name: 'sentiment',
    required: false,
    enum: SentimentEnum.options,
    description: 'You can choose many',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: createBaseResponseDto(
      FeedbackResponseSchema,
      'FeedbackResponseSchema',
    ),
  })
  @ApiOperation({
    summary: 'Filter feedback by sentiment',
  })
  @ZodSerializerDto(FeedbackFilteredResponseSchema)
  async sampleFeedbackFiltered(
    @Query(new ZodValidationPipe(FeedbackQueryDto))
    query: FeedbackQueryDto,
  ): Promise<FeedbackFilteredResponseDto> {
    return this.sampleService.sampleFeedbackFiltered(query);
  }

  @Get('feedback/grouped')
  @ApiOperation({
    summary: 'Get feedbacks grouped by sentiment',
  })
  @ApiOkResponse({
    type: createBaseResponseDto(
      FeedbackGroupedArrayResponseSchema,
      'FeedbackGroupedArrayResponseSchema',
    ),
  })
  @ZodSerializerDto(FeedbackGroupedArrayResponseSchema)
  async sampleFeedbackGrouped(): Promise<FeedbackGroupedArrayResponseDto> {
    return this.sampleService.sampleFeedbackGrouped();
  }

  @Get('feedback/sentiment-summary')
  @ApiOperation({ summary: 'Get sentiment summary for user' })
  @ApiOkResponse({
    type: createBaseResponseDto(
      FeedbackSummaryResponseSchema,
      'FeedbackSummaryResponseSchema',
    ),
  })
  @ZodSerializerDto(FeedbackSummaryResponseDto)
  async sampleFeedbackSentimentSummary(): Promise<FeedbackSummaryResponseDto> {
    return this.sampleService.sampleFeedbackSentimentSummary();
  }
}
