import { Injectable } from '@nestjs/common';
import type {
  FeedbackFilteredResponseDto,
  FeedbackGroupedArrayResponseDto,
  FeedbackQueryDto,
  FeedbackSummaryResponseDto,
} from '../feedback/dto/feedback.dto';
import {
  feedbackData,
  feedbackGroupedData,
  feedbackSummaryData,
} from './sample.data';

@Injectable()
export class SampleService {
  sampleFeedbackFiltered(query: FeedbackQueryDto): FeedbackFilteredResponseDto {
    const { sentiment, limit, page } = query;
    let result = feedbackData;

    if (sentiment && sentiment.length > 0) {
      result = result.filter((item) => sentiment.includes(item.sentiment));
    }

    const total = result.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      feedbacks: result.slice(start, end),
      pagination: { page, limit, total, pages },
    };
  }

  sampleFeedbackGrouped(): FeedbackGroupedArrayResponseDto {
    return feedbackGroupedData;
  }

  sampleFeedbackSentimentSummary(): FeedbackSummaryResponseDto {
    return feedbackSummaryData;
  }
}
