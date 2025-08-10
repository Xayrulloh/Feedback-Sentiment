import { Injectable } from "@nestjs/common";
import { AIService } from "../AI/AI.service";
import { FeedbackRequestDto } from "./dto/feedback.dto";
import { FeedbackResponseDto } from "./dto/feedback.dto";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DrizzleAsyncProvider } from "src/database/drizzle.provider";
import { v4 as uuidv4 } from "uuid";
import * as schema from 'src/database/schema';

@Injectable()
export class FeedbackManualService {
    constructor(
        private readonly aiService: AIService,
        private readonly db: NodePgDatabase
    ) {}

    // async proccessManualFeedback(dto: FeedbackRequestDto): Promise<FeedbackResponseDto[]> {
    //     const aiResults = await this.aiService.analyzeMany(dto);
        
    //     const createdFeedabacks = await Promise.all(
    //         aiResults.map(async (result) => {
    //             const id = uuidv4();
    //             const now = new Date();

    //             await this.db.insert(schema.feedbacks).values({
    //                 id,
    //                 user_id: dto.userId,
    //                 folder_id: dto.folderId ?? null,
    //                 content: result.content,
    //                 sentiment: result.sentiment,
    //                 confidence: Math.round(result.confidence),
    //                 summary: result.summary,
    //                 created_at: now,
    //             })

    //             return {
    //                 id,
    //                 content: result.content,
    //                 sentiment: result.sentiment,
    //                 confidence: result.confidence,
    //                 createdAt: now.toISOString(),
    //             };

    //         })
    //     )

    //     return createdFeedabacks;
    // } 
}