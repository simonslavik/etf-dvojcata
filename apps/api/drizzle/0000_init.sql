CREATE TABLE "ad_spend" (
	"utm_content" text PRIMARY KEY NOT NULL,
	"czk" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" uuid NOT NULL,
	"step" text NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sid" text NOT NULL,
	"event" text NOT NULL,
	"variant" text NOT NULL,
	"utm_source" text,
	"utm_campaign" text,
	"utm_content" text,
	"device" text,
	"props" jsonb,
	"t_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sid" text,
	"variant" text NOT NULL,
	"source" text,
	"utm_source" text,
	"utm_campaign" text,
	"utm_content" text,
	"device" text,
	"interest" text,
	"calc_monthly" integer,
	"consent_text" text,
	"monthly_band" text,
	"wants_call" boolean DEFAULT false NOT NULL,
	"phone" text,
	"call_consent_text" text,
	"score" integer DEFAULT 0 NOT NULL,
	"score_reasons" jsonb,
	"stage" text DEFAULT 'lead' NOT NULL,
	"handed_over_at" timestamp with time zone,
	"handoff_status" text,
	"unsubscribed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"n" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_jobs" ADD CONSTRAINT "email_jobs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_jobs_lead_step_uq" ON "email_jobs" USING btree ("lead_id","step");--> statement-breakpoint
CREATE INDEX "email_jobs_due_idx" ON "email_jobs" USING btree ("status","send_at");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_sid_idx" ON "events" USING btree ("sid");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_email_uq" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_token_uq" ON "leads" USING btree ("token");--> statement-breakpoint
CREATE INDEX "leads_created_idx" ON "leads" USING btree ("created_at");