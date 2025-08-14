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
  Query,
  Sse,
  Res,

} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable, interval } from 'rxjs';
import {
  map,
  switchMap,
  distinctUntilChanged,
  startWith,
  share,
} from 'rxjs/operators';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ALLOWED_MIME_TYPES } from 'src/utils/constants';
import { type AuthenticatedRequest } from 'src/shared/types/request-with-user';
import {
  FeedbackArrayResponseDto,
  FeedbackArrayResponseSchema,
  FeedbackRequestDto,
  FeedbackGroupedArrayResponseDto,
  FeedbackGroupedArrayResponseSchema,
  FeedbackGetSummaryResponseDto,
  FeedbackSummaryEventDto,
  FilteredFeedbackSchema,
  GetFeedbackQuerySchemaDto,
  SentimentEnum,
  ReportDownloadRequestDto,
} from './dto/feedback.dto';
import type { Response } from 'express'; // TODO: fix all imports

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // FIXME: where's apibearerauth
  @UseGuards(AuthGuard('jwt'))
  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: FeedbackArrayResponseDto,
    description: 'Array of processed feedback items', // TODO: no need description in here, give it to zod schema
  })
  @ApiOperation({
    summary: 'Sending text based feedback and getting the ai analyze',
    description: 'Sending text based feedback and getting the ai analyze', // TODO: no need description in here, give it to zod schema
  })
  @ZodSerializerDto(FeedbackArrayResponseSchema)
  async feedbackManual(
    @Body() body: FeedbackRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackArrayResponseDto> {
    const result = await this.feedbackService.feedbackManual(body, req.user); // FIXME: just return to feedbackService

    return result;
  }

  // FIXME: where's apibearerauth
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
    description: 'Array of processed feedback items from uploaded file', // TODO: no need description in here, give it to zod schema
  })
  @ZodSerializerDto(FeedbackArrayResponseSchema)
  async feedbackUpload(
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

  // FIXME: where's apibearerauth
  @UseGuards(AuthGuard('jwt'))
  @Get('sentiment-summary')
  @ApiConsumes('application/json') // TODO: do we really need this?
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get sentiment summary for user',
    description: 'Retrieve sentiment analysis summary for a specific user',
  })
  @ApiOkResponse({
    type: FeedbackGetSummaryResponseDto,
    description: 'Sentiment summary data for the specified user', // TODO: no need description in here, give it to zod schema
  })
  @ZodSerializerDto(FeedbackGetSummaryResponseDto)
  async getSentimentSummary(
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackGetSummaryResponseDto> {
    return await this.feedbackService.feedbackSummary(req.user.id); // TODO: research difference between return and return await
  }

  // FIXME: where's apibearerauth
  @UseGuards(AuthGuard('jwt')) // FIXME: let's comment this whole method (feedbackStreamSummary)
  @Sse('sentiment-summary/stream')
  @ApiConsumes('text/event-stream')
  @ApiOperation({
    summary: 'Stream sentiment summary updates',
    description:
      'Real-time sentiment analysis summary updates for the authenticated user',
  })
  @ApiOkResponse({ type: FeedbackSummaryEventDto })
  feedbackStreamSummary(
    @Req() req: AuthenticatedRequest,
  ): Observable<FeedbackSummaryEventDto> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() => this.feedbackService.feedbackSummary(req.user.id)),
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

  // FIXME: where's apibearerauth
  @UseGuards(AuthGuard('jwt'))
  @Get('grouped')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get grouped feedback',
  })
  @ApiOkResponse({
    type: FeedbackGroupedArrayResponseDto,
    description: 'Array of grouped feedback with counts and items', // TODO: no need description in here, give it to zod schema
  })
  @ZodSerializerDto(FeedbackGroupedArrayResponseSchema)
  async feedbackGrouped(
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackGroupedArrayResponseDto> {
    return this.feedbackService.feedbackGrouped(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiQuery({ name: 'sentiment', required: false, enum: SentimentEnum.options })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Filter feedback by sentiment',
    description: 'Filtering feedback by sentimant with pagination',
  })
  @ZodSerializerDto(FilteredFeedbackSchema)
  async feedbackFiltered(
    @Query(new ZodValidationPipe(GetFeedbackQuerySchemaDto))
    query: GetFeedbackQuerySchemaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.feedbackFiltered(query, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Download either pdf or csv report file',
    description: 'Download either pdf or csv file report with full details or just summary',
  })
  @HttpCode(HttpStatus.OK)
  @Get('report')
async getFeedbackReport(
  @Query() query: ReportDownloadRequestDto,
  @Req() req: AuthenticatedRequest,
  @Res() res: Response,
) {
  return this.feedbackService.feedbackReportDownload(query, req.user, res);
}
  
}
