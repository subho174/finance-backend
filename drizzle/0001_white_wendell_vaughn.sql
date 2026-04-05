CREATE INDEX "user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "category_idx" ON "transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "type_category_idx" ON "transactions" USING btree ("type","category");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_income_calc_idx" ON "transactions" USING btree ("user_id","amount") WHERE "transactions"."type" = 'income' AND "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "user_expense_calc_idx" ON "transactions" USING btree ("user_id","amount") WHERE "transactions"."type" = 'expense' AND "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "global_income_calc_idx" ON "transactions" USING btree ("amount") WHERE "transactions"."type" = 'income' AND "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "global_expense_calc_idx" ON "transactions" USING btree ("amount") WHERE "transactions"."type" = 'expense' AND "transactions"."deleted_at" IS NULL;