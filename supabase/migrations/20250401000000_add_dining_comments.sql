-- Create dining_comments table
CREATE TABLE IF NOT EXISTS "public"."dining_comments" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL,
    "dining_hall_name" text NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- Grant access to the table
GRANT ALL ON TABLE "public"."dining_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."dining_comments" TO "service_role";
GRANT ALL ON TABLE "public"."dining_comments" TO "anon";

-- Create policies for the comments table
-- Everyone can view comments
CREATE POLICY "Anyone can view comments" ON "public"."dining_comments"
FOR SELECT USING (true);

-- Only authenticated users can insert their own comments
CREATE POLICY "Authenticated users can insert their own comments" ON "public"."dining_comments"
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can only update and delete their own comments
CREATE POLICY "Users can update their own comments" ON "public"."dining_comments"
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON "public"."dining_comments"
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable RLS on dining_comments
ALTER TABLE "public"."dining_comments" ENABLE ROW LEVEL SECURITY; 