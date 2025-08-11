import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { AIService } from "../AI/AI.service";
import { FeedbackRequestDto, FeedbackRequestSchema, FeedbackResponseSchema } from "./dto/feedback.dto";
import { FeedbackResponseDto } from "./dto/feedback.dto";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DrizzleAsyncProvider } from "src/database/drizzle.provider";
import { v4 as uuidv4 } from "uuid";
import * as schema from 'src/database/schema';
import type { UserSchemaType } from "src/utils/zod.schemas";
import { MIN_FEEDBACK_LENGTH } from "src/utils/constants";
import type { Express } from 'express';
import * as Papa from 'papaparse';

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

    async processFeedbackFile(file: Express.Multer.File): Promise<FeedbackRequestDto> {
        try {
          if (!file.buffer) {
            throw new BadRequestException('File buffer is missing');
          }
          
          const csvContent = file.buffer.toString('utf8');
          const parseResult = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim().toLowerCase(),
            dynamicTyping: false, 
            delimitersToGuess: [',', '\t', '|', ';']
          });
    
          if (parseResult.errors.length > 0) {
            throw new BadRequestException(
              `CSV parsing error: ${parseResult.errors[0].message}`
            );
          }
    
          const data = parseResult.data as Record<string, any>[];
          
          if (!data || data.length === 0) {
            throw new BadRequestException('CSV file is empty or contains no valid data');
          }
    
          const headers = Object.keys(data[0]);
          const feedbackColumn = headers.find(header => 
            header.toLowerCase().includes('feedback')
          );
    
          if (!feedbackColumn) {
            throw new BadRequestException(
              `No feedback column found in CSV. Expected a column containing "feedback" in its name. Available columns: ${headers.join(', ')}`
            );
          }
    
          const feedbacks: string[] = data
            .map(row => row[feedbackColumn])
            .filter((feedback): feedback is string => {
              return typeof feedback === 'string' && 
                     feedback.trim().length >= MIN_FEEDBACK_LENGTH;
            })
            .map(feedback => feedback.trim());
    
          if (feedbacks.length === 0) {
            throw new BadRequestException(
              `No valid feedback found. Ensure feedback entries are at least ${MIN_FEEDBACK_LENGTH} characters long.`
            );
          }
    
          const validationResult = FeedbackRequestSchema.safeParse({ feedbacks });
          
          if (!validationResult.success) {
            const errorMessage = validationResult.error.errors
              .map(err => err.message)
              .join(', ');
            throw new BadRequestException(`Validation failed: ${errorMessage}`);
          }
    
          return validationResult.data;
    
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          
          throw new BadRequestException(
            `Failed to process feedback file: ${error.message}`
          );
        }
      }
}