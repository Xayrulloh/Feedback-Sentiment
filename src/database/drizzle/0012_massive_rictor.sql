CREATE INDEX "idx_feedbacks_sentiment" ON "feedbacks" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "idx_feedbacks_summary" ON "feedbacks" USING btree ("summary");--> statement-breakpoint
CREATE INDEX "idx_files_user_id" ON "files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_feedbacks_file_id" ON "users_feedbacks" USING btree ("file_id");