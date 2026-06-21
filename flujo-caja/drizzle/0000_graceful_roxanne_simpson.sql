CREATE TYPE "public"."accion_auditoria" AS ENUM('login', 'crear', 'editar', 'eliminar', 'invitar', 'cambiar_rol');--> statement-breakpoint
CREATE TYPE "public"."estado_cliente" AS ENUM('activo', 'inactivo');--> statement-breakpoint
CREATE TYPE "public"."estado_obligacion" AS ENUM('pendiente', 'pagada');--> statement-breakpoint
CREATE TYPE "public"."estado_transaccion" AS ENUM('activa', 'eliminada');--> statement-breakpoint
CREATE TYPE "public"."estado_usuario" AS ENUM('activo', 'inactivo');--> statement-breakpoint
CREATE TYPE "public"."frecuencia" AS ENUM('mensual', 'quincenal', 'semanal');--> statement-breakpoint
CREATE TYPE "public"."moneda" AS ENUM('COP', 'USD');--> statement-breakpoint
CREATE TYPE "public"."periodicidad" AS ENUM('mensual', 'bimestral', 'cuatrimestral', 'anual', 'otra');--> statement-breakpoint
CREATE TYPE "public"."pide_cliente" AS ENUM('si', 'opcional', 'no');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('admin', 'visor');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimiento" AS ENUM('ingreso', 'egreso');--> statement-breakpoint
CREATE TYPE "public"."tipo_relacion" AS ENUM('anticipo', 'recurrente', 'ambos');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"tipo" "tipo_movimiento" NOT NULL,
	"categoria_madre_id" uuid,
	"pide_cliente" "pide_cliente" DEFAULT 'no' NOT NULL,
	"es_costo_directo" boolean DEFAULT false NOT NULL,
	"descripcion_dummies" text DEFAULT '' NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
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
	"caja_minima_cop" numeric(15, 2) DEFAULT '0' NOT NULL,
	"horizonte_proyeccion_semanas" integer DEFAULT 8 NOT NULL,
	"moneda_por_defecto" "moneda" DEFAULT 'COP' NOT NULL,
	"tasa_cambio_sugerida" numeric(12, 4),
	"requerir_comprobante" boolean DEFAULT false NOT NULL,
	"requerir_cliente_ingresos" boolean DEFAULT false NOT NULL,
	"dias_alerta_inactividad" integer DEFAULT 0 NOT NULL,
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
CREATE TABLE "obligaciones_tributarias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"periodicidad" "periodicidad" DEFAULT 'mensual' NOT NULL,
	"proximo_vencimiento" date,
	"dias_anticipacion" integer DEFAULT 5 NOT NULL,
	"monto_estimado_cop" numeric(15, 2),
	"estado" "estado_obligacion" DEFAULT 'pendiente' NOT NULL,
	"transaccion_id" uuid,
	"nota" text,
	"activa" boolean DEFAULT true NOT NULL,
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
	"es_recurrente" boolean DEFAULT false NOT NULL,
	"frecuencia" "frecuencia",
	"es_proyectada" boolean DEFAULT false NOT NULL,
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
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_categoria_madre_id_categorias_id_fk" FOREIGN KEY ("categoria_madre_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligaciones_tributarias" ADD CONSTRAINT "obligaciones_tributarias_transaccion_id_transacciones_id_fk" FOREIGN KEY ("transaccion_id") REFERENCES "public"."transacciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;