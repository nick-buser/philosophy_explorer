CREATE TYPE "public"."date_certainty" AS ENUM('exact', 'circa', 'range', 'flourished', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."influence_type" AS ENUM('direct', 'indirect', 'critical', 'revival');--> statement-breakpoint
CREATE TYPE "public"."note_source" AS ENUM('manual', 'api', 'seed');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('summary', 'interpretation', 'quote', 'context', 'bibliography', 'other');--> statement-breakpoint
CREATE TYPE "public"."school_role" AS ENUM('founder', 'member', 'student', 'critic', 'associated');--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('treatise', 'dialogue', 'essay', 'letter', 'fragment', 'commentary', 'poem', 'speech', 'collection', 'other');--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"note_type" "note_type" DEFAULT 'other' NOT NULL,
	"source_type" "note_source" DEFAULT 'manual' NOT NULL,
	"source_name" text,
	"source_url" text,
	"philosopher_id" uuid,
	"work_id" uuid,
	"school_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "philosopher_influences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"influencer_id" uuid NOT NULL,
	"influenced_id" uuid NOT NULL,
	"influence_type" "influence_type" DEFAULT 'direct' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "philosopher_schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"philosopher_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"role" "school_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "philosophers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"also_known_as" text,
	"born_year" integer,
	"born_year_end" integer,
	"born_certainty" date_certainty DEFAULT 'unknown' NOT NULL,
	"died_year" integer,
	"died_year_end" integer,
	"died_certainty" date_certainty DEFAULT 'unknown' NOT NULL,
	"nationality" text,
	"bio_short" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "philosophers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"also_known_as" text,
	"period_start_year" integer,
	"period_end_year" integer,
	"period_certainty" date_certainty DEFAULT 'unknown' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"original_title" text,
	"philosopher_id" uuid NOT NULL,
	"work_type" "work_type" DEFAULT 'other' NOT NULL,
	"composed_year" integer,
	"composed_year_end" integer,
	"composed_certainty" date_certainty DEFAULT 'unknown' NOT NULL,
	"original_language" text,
	"description_short" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "works_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_philosopher_id_philosophers_id_fk" FOREIGN KEY ("philosopher_id") REFERENCES "public"."philosophers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "philosopher_influences" ADD CONSTRAINT "philosopher_influences_influencer_id_philosophers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."philosophers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "philosopher_influences" ADD CONSTRAINT "philosopher_influences_influenced_id_philosophers_id_fk" FOREIGN KEY ("influenced_id") REFERENCES "public"."philosophers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "philosopher_schools" ADD CONSTRAINT "philosopher_schools_philosopher_id_philosophers_id_fk" FOREIGN KEY ("philosopher_id") REFERENCES "public"."philosophers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "philosopher_schools" ADD CONSTRAINT "philosopher_schools_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_philosopher_id_philosophers_id_fk" FOREIGN KEY ("philosopher_id") REFERENCES "public"."philosophers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pi_pair_type_idx" ON "philosopher_influences" USING btree ("influencer_id","influenced_id","influence_type");--> statement-breakpoint
CREATE UNIQUE INDEX "ps_philosopher_school_role_idx" ON "philosopher_schools" USING btree ("philosopher_id","school_id","role");