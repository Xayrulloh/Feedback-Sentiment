import { FeedbackSentimentEnum } from 'src/utils/zod.schemas';

export const feedbackData = [
  {
    content: 'The product quality is excellent!',
    sentiment: FeedbackSentimentEnum.POSITIVE,
    confidence: 100,
    summary: 'product',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: '2fdf9f7e-d844-480f-884c-da82a9dc87f2',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'Delivery was late and packaging was damaged.',
    sentiment: FeedbackSentimentEnum.NEGATIVE,
    confidence: 90,
    summary: 'Delivery',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: '4fcb290d-b967-4f4d-b1fc-fcfe60f35351',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'Customer service was very helpful.',
    sentiment: FeedbackSentimentEnum.POSITIVE,
    confidence: 90,
    summary: 'customer service',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: '7256b625-8750-4c65-9ff7-0bc127f65dd7',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'The website is easy to navigate.',
    sentiment: FeedbackSentimentEnum.POSITIVE,
    confidence: 100,
    summary: 'navigating',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: 'b2bf1dcd-0a58-4298-808f-28922cbf6afd',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'I am not satisfied with the return policy.',
    sentiment: FeedbackSentimentEnum.NEGATIVE,
    confidence: 95,
    summary: 'return policy',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: '9a12300b-82c5-4137-85dc-501106c225f8',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'Prices are reasonable compared to competitors.',
    sentiment: FeedbackSentimentEnum.POSITIVE,
    confidence: 85,
    summary: 'prices',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: '9b77a337-8518-4388-9d81-eb43f0f694c2',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'The mobile app crashes frequently.',
    sentiment: FeedbackSentimentEnum.NEGATIVE,
    confidence: 80,
    summary: 'crashes',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: 'c6a91e75-4446-412b-951e-ed31254e9227',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'Fast shipping and great packaging.',
    sentiment: FeedbackSentimentEnum.POSITIVE,
    confidence: 100,
    summary: 'shipping',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: '0acaf89f-ab89-4cc5-89c0-e083d82c9557',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'Product description matched exactly.',
    sentiment: FeedbackSentimentEnum.POSITIVE,
    confidence: 100,
    summary: 'product',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: '8df6eb52-3e4e-4781-b7e0-92cd76d296be',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    content: 'I will definitely recommend this to my friends.',
    sentiment: FeedbackSentimentEnum.POSITIVE,
    confidence: 100,
    summary: 'recommendation',
    userId: '460dc6c6-6d2f-4fea-b378-a74af16aa868',
    fileId: '598ddb83-be1e-4c47-960a-cdbd39c15a9d',
    id: '26671e73-96d8-488c-bff9-5205f3a5ae33',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

export const feedbackGroupedData = [
  {
    summary: 'product',
    count: 2,
    items: [
      {
        id: '2fdf9f7e-d844-480f-884c-da82a9dc87f2',
        content: 'The product quality is excellent!',
        sentiment: FeedbackSentimentEnum.POSITIVE,
      },
      {
        id: '8df6eb52-3e4e-4781-b7e0-92cd76d296be',
        content: 'Product description matched exactly.',
        sentiment: FeedbackSentimentEnum.POSITIVE,
      },
    ],
  },
  {
    summary: 'Delivery',
    count: 1,
    items: [
      {
        id: '4fcb290d-b967-4f4d-b1fc-fcfe60f35351',
        content: 'Delivery was late and packaging was damaged.',
        sentiment: FeedbackSentimentEnum.NEGATIVE,
      },
    ],
  },
  {
    summary: 'customer service',
    count: 1,
    items: [
      {
        id: '7256b625-8750-4c65-9ff7-0bc127f65dd7',
        content: 'Customer service was very helpful.',
        sentiment: FeedbackSentimentEnum.POSITIVE,
      },
    ],
  },
  {
    summary: 'shipping',
    count: 1,
    items: [
      {
        id: '0acaf89f-ab89-4cc5-89c0-e083d82c9557',
        content: 'Fast shipping and great packaging.',
        sentiment: FeedbackSentimentEnum.POSITIVE,
      },
    ],
  },
  {
    summary: 'return policy',
    count: 1,
    items: [
      {
        id: '9a12300b-82c5-4137-85dc-501106c225f8',
        content: 'I am not satisfied with the return policy.',
        sentiment: FeedbackSentimentEnum.NEGATIVE,
      },
    ],
  },
  {
    summary: 'navigating',
    count: 1,
    items: [
      {
        id: 'b2bf1dcd-0a58-4298-808f-28922cbf6afd',
        content: 'The website is easy to navigate.',
        sentiment: FeedbackSentimentEnum.POSITIVE,
      },
    ],
  },
  {
    summary: 'prices',
    count: 1,
    items: [
      {
        id: '9b77a337-8518-4388-9d81-eb43f0f694c2',
        content: 'Prices are reasonable compared to competitors.',
        sentiment: FeedbackSentimentEnum.POSITIVE,
      },
    ],
  },
  {
    summary: 'crashes',
    count: 1,
    items: [
      {
        id: 'c6a91e75-4446-412b-951e-ed31254e9227',
        content: 'The mobile app crashes frequently.',
        sentiment: FeedbackSentimentEnum.NEGATIVE,
      },
    ],
  },
  {
    summary: 'recommendation',
    count: 1,
    items: [
      {
        id: '26671e73-96d8-488c-bff9-5205f3a5ae33',
        content: 'I will definitely recommend this to my friends.',
        sentiment: FeedbackSentimentEnum.POSITIVE,
      },
    ],
  },
];

export const feedbackSummaryData = [
  {
    sentiment: FeedbackSentimentEnum.POSITIVE,
    count: 7,
    percentage: 70,
  },
  {
    sentiment: FeedbackSentimentEnum.NEGATIVE,
    count: 3,
    percentage: 30,
  },
];
