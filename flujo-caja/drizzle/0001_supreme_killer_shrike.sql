ALTER TABLE "config" ADD COLUMN "moneda_por_defecto" "moneda" DEFAULT 'COP' NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "tasa_cambio_sugerida" numeric(12, 4);--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "requerir_comprobante" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "requerir_cliente_ingresos" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "dias_alerta_inactividad" integer DEFAULT 0 NOT NULL;