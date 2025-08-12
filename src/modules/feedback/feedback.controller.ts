import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Sse,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Observable, interval } from 'rxjs';
import {
  map,
  switchMap,
  distinctUntilChanged,
  startWith,
  share,
} from 'rxjs/operators';

import { ZodSerializerDto } from 'nestjs-zod';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ALLOWED_MIME_TYPES } from 'src/utils/constants';
import { type AuthenticatedRequest } from 'src/shared/types/request-with-user';
import {
  FeedbackArrayResponseDto,
  FeedbackArrayResponseSchema,
  FeedbackRequestDto,
  SentimentSummaryResponseDto,
  SentimentSummaryEventDto,
} from './dto/feedback.dto';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: FeedbackArrayResponseDto,
    description: 'Array of processed feedback items',
  })
  @ZodSerializerDto(FeedbackArrayResponseSchema)
  async feedbackManual(
    @Body() body: FeedbackRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackArrayResponseDto> {
    const result = await this.feedbackService.feedbackManual(body, req.user);

    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload CSV feedback file',
    description: 'Upload a CSV file containing feedback data for processing',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing feedback data',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: FeedbackArrayResponseDto,
    description: 'Array of processed feedback items from uploaded file',
  })
  @ZodSerializerDto(FeedbackArrayResponseSchema)
  async uploadFeedback(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackArrayResponseDto> {
    if (!file) {
      throw new UnprocessableEntityException('No file uploaded');
    }

    if (
      !ALLOWED_MIME_TYPES.includes(file.mimetype) ||
      !file.originalname?.toLowerCase().endsWith('.csv')
    ) {
      throw new UnprocessableEntityException(
        `Invalid file type: ${file.mimetype}. Only CSV files are allowed.`,
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      // TODO: ask file size from frontend devs
      throw new UnprocessableEntityException('File too large (max 10MB)');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    return this.feedbackService.feedbackUpload(file, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sentiment-summary')
  @ApiConsumes('application/json')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get sentiment summary for user',
    description: 'Retrieve sentiment analysis summary for a specific user',
  })
  @ApiOkResponse({
    type: SentimentSummaryResponseDto,
    description: 'Sentiment summary data for the specified user',
  })
  @ZodSerializerDto(SentimentSummaryResponseDto)
  async getSentimentSummary(
    @Req() req: AuthenticatedRequest,
  ): Promise<SentimentSummaryResponseDto> {
    return await this.feedbackService.getSentimentSummary(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Sse('sentiment-summary/stream')
  @ApiConsumes('text/event-stream')
  @ApiOperation({
    summary: 'Stream sentiment summary updates',
    description:
      'Real-time sentiment analysis summary updates for the authenticated user',
  })
  @ApiOkResponse({
    description: 'Server-sent events stream of sentiment summary updates',
    type: SentimentSummaryEventDto,
  })
  sseSentimentSummary(
    @Req() req: AuthenticatedRequest,
  ): Observable<SentimentSummaryEventDto> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() => this.feedbackService.getSentimentSummary(req.user.id)),
      map((summary) => ({
        type: 'sentiment_update' as const,
        data: summary.data,
        updatedAt: summary.updatedAt || new Date().toISOString(),
      })),
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev.data) === JSON.stringify(curr.data),
      ),
      share(),
    );
  }
}
