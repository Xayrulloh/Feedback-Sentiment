import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async userDisableToggle(userId: string) {
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(eq(schema.usersSchema.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.db
      .update(schema.usersSchema)
      .set({ isDisabled: !user.isDisabled })
      .where(eq(schema.usersSchema.id, userId))
      .returning();

    return updated[0];
  }

  async userSuspend(userId: string) {
    const [user] = await this.db
      .select()
      .from(schema.usersSchema)
      .where(eq(schema.usersSchema.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.db
      .update(schema.usersSchema)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(schema.usersSchema.id, userId))
      .returning();

    return updated[0];
  }
}
