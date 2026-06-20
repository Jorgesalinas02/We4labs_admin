CREATE TYPE "public"."accion_auditoria" AS ENUM('login', 'crear', 'editar', 'eliminar', 'invitar', 'cambiar_rol');--> statement-breakpoint
CREATE TYPE "public"."estado_cliente" AS ENUM('activo', 'inactivo');--> statement-breakpoint
CREATE TYPE "public"."estado_transaccion" AS ENUM('activa', 'eliminada');--> statement-breakpoint
CREATE TYPE "public"."estado_usuario" AS ENUM('activo', 'inactivo');--> statement-breakpoint
CREATE TYPE "public"."grupo_gasto" AS ENUM('nomina', 'operativo', 'cliente', 'admin', 'marketing', 'otro', 'na');--> statement-breakpoint
CREATE TYPE "public"."moneda" AS ENUM('COP', 'USD');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('admin', 'visor');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimiento" AS ENUM('ingreso', 'egreso');--> statement-breakpoint
CREATE TYPE "public"."tipo_relacion" AS ENUM('anticipo', 'recurrente', 'ambos');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"tipo" "tipo_movimiento" NOT NULL,
	"grupo_gasto" "grupo_gasto" DEFAULT 'na' NOT NULL,
	"descripcion_dummies" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"tipo_relacion" "tipo_relacion" DEFAULT 'ambos' NOT NULL,
	"estado" "estado_cliente" DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"saldo_inicial_cop" numeric(15, 2) DEFAULT '0' NOT NULL,
	"saldo_inicial_fecha" date,
	"umbral_alerta_cop" numeric(15, 2) DEFAULT '0' NOT NULL,
	"zona_horaria" text DEFAULT 'America/Bogota' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario" text NOT NULL,
	"usuario_email" text,
	"accion" "accion_auditoria" NOT NULL,
	"entidad" text NOT NULL,
	"entidad_id" text,
	"valores_antes" jsonb,
	"valores_despues" jsonb,
	"detalle" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transacciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_movimiento" NOT NULL,
	"categoria_id" uuid NOT NULL,
	"cliente_id" uuid,
	"moneda" "moneda" DEFAULT 'COP' NOT NULL,
	"monto_original" numeric(15, 2) NOT NULL,
	"tasa_cambio" numeric(12, 4) DEFAULT '1' NOT NULL,
	"monto_cop" numeric(15, 2) NOT NULL,
	"fecha" date NOT NULL,
	"descripcion" text NOT NULL,
	"metodo_pago" varchar(40),
	"comprobante_url" text,
	"comprobante_pathname" text,
	"creado_por" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"estado" "estado_transaccion" DEFAULT 'activa' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"clerk_id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nombre" text,
	"rol" "rol" DEFAULT 'visor' NOT NULL,
	"estado" "estado_usuario" DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;