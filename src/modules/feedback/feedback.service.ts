import { Inject, Injectable } from "@nestjs/common";
import { AIService } from "../AI/AI.service";
import { FeedbackRequestDto, FeedbackResponseSchema } from "./dto/feedback.dto";
import { FeedbackResponseDto } from "./dto/feedback.dto";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DrizzleAsyncProvider } from "src/database/drizzle.provider";
import { v4 as uuidv4 } from "uuid";
import * as schema from 'src/database/schema';
import type { UserSchemaType } from "src/utils/zod.schemas";

@Injectable()
export class FeedbackService {
    constructor(
         private readonly aiService: AIService,

  @Inject(DrizzleAsyncProvider)
  private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async processFeedback(dto: FeedbackRequestDto, req: UserSchemaType): Promise<FeedbackResponseDto[]> {

        const aiResults = await this.aiService.analyzeMany(dto);

        const createdFeedabacks = await Promise.all(
            aiResults.map(async (result) => {
                const id = uuidv4();
                const now = new Date();

                await this.db.insert(schema.feedbacks).values({
                    id,
                    userId: req.id,
                    folderId: null,
                    content: result.content,
                    sentiment: result.sentiment,
                    confidence: Math.round(result.confidence),
                    summary: result.summary,
                    createdAt: now,
                });

                const feedbackObject =  {
                    id,
                    content: result.content,
                    sentiment: result.sentiment,
                    confidence: result.confidence,
                    createdAt: now,
                };

                 return feedbackObject;

            })
        );

        return createdFeedabacks;
    } 
}