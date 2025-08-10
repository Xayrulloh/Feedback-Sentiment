import * as z from 'zod';
import { FeedbackSentimentEnum } from 'src/utils/zod.schemas';
import { createZodDto } from 'nestjs-zod';
import { FeedbackSchema } from 'src/utils/zod.schemas';

const FeedbackRequestSchema  = z.object({
    feedbacks: z.
    array(z.string().min(3)).
    nonempty().describe('Array that combines different feedback, each at least 3 chars long'),
});

class FeedbackRequestDto extends createZodDto(FeedbackRequestSchema) {}


const FeedbackResponseSchema = FeedbackSchema.pick({
    id: true,
    content: true,
    sentiment: true,
    confidence: true,
    createdAt: true,
});

// z.object({
//     id: z.string().uuid().describe("Feedback id"),
//     content: z.string().describe("Feedback content"),
//     sentiment: z.enum([
//         FeedbackSentimentEnum.NEGATIVE, 
//         FeedbackSentimentEnum.NEUTRAL, 
//         FeedbackSentimentEnum.POSITIVE, 
//         FeedbackSentimentEnum.UNKNOWN]).describe("Feedback sentiment"),
//     confidence: z.number().min(0).max(100).describe("Level of confidence"),
//     createdAt: z.coerce.date().transform((date) => date.toISOString()).describe("Creating time"),
// }); // HERE I NEED TO REFACTOR THE CODE I NEED TO USE FeedbackSchema.pick(), 

class FeedbackResponseDto extends createZodDto(FeedbackResponseSchema) {}

export {FeedbackRequestDto, FeedbackResponseDto, FeedbackRequestSchema, FeedbackResponseSchema}

