import { v4 as uuidv4 } from 'uuid';
import * as schema from './src/database/schema'; // adjust path as needed
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { FeedbackSentimentEnum } from 'src/utils/zod.schemas';
// Setup pg client and Drizzle DB instance
const client = new pg.Client({
  connectionString: 'postgresql://postgres:123456@localhost:5433/feedback_db', // your DB connection string
});

async function main() {
  await client.connect();
  const db = drizzle(client);

  const id = uuidv4();
  const now = new Date();

  try {
    await db.insert(schema.feedbacks).values({
      id,
      userId: '19b5edbf-8014-4c6e-a25c-60edc16e4e1d', // use a valid user id from your DB
      folderId: null,
      content: 'test content',
      sentiment: FeedbackSentimentEnum.NEGATIVE,
      confidence: 50,
      summary: 'test summary',
      createdAt: now,
    });

    console.log('Insert succeeded!');
  } catch (error) {
    console.error('Insert failed:', error);
  } finally {
    await client.end();
  }
}

main();
