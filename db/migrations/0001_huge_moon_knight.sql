CREATE TYPE "public"."payment_status" AS ENUM('authentifizierung', 'bezahlt', 'abgelehnt', 'abgebrochen');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"citizen_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "payment_status" DEFAULT 'authentifizierung' NOT NULL,
	"card_last4" text NOT NULL,
	"card_holder" text NOT NULL,
	"transaction_id" text NOT NULL,
	"challenge_hash" text,
	"challenge_expires_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_citizen_id_citizens_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."citizens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_application_idx" ON "payments" USING btree ("application_id");