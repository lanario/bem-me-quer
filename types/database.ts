/**
 * Tipos do banco de dados Supabase (espelho do schema PostgreSQL).
 * Alinhado à migração 00001_initial_schema.sql
 */

export type SellStatus = "PENDENTE" | "CONCLUIDA" | "CANCELADA";
export type PurchaseStatus = "PENDENTE" | "RECEBIDA" | "CANCELADA";
export type TransferStatus = "PENDENTE" | "CONCLUIDA" | "CANCELADA";
export type ReturnStatus = "PENDENTE" | "APROVADA" | "REJEITADA";
export type MovementType = "ENTRADA" | "SAIDA" | "AJUSTE" | "DEVOLUCAO";
export type MovementReason =
  | "COMPRA"
  | "VENDA"
  | "AJUSTE"
  | "PERDA"
  | "DEVOLUCAO_CLIENTE";
export type ReturnReason = "DEFEITO" | "TROCA" | "DESISTENCIA" | "OUTRO";
export type ProductCondition = "NOVO" | "USADO" | "DANIFICADO";
export type ProductSize = "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: number;
          name: string;
          email: string;
          phone: string;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          email: string;
          phone: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          email?: string;
          phone?: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          price_default: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          price_default?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      brands: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          size: ProductSize;
          color: string;
          sell_price: number | null;
          brand_id: number | null;
          category_id: number | null;
          track_stock: boolean;
          barcode: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          description?: string | null;
          size: ProductSize;
          color: string;
          sell_price?: number | null;
          brand_id?: number | null;
          category_id?: number | null;
          track_stock?: boolean;
          barcode?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      stock: {
        Row: {
          id: number;
          product_id: number;
          location_id: number;
          quantity: number;
          min_quantity: number;
          max_quantity: number | null;
          location: string | null;
          cost_price: number;
          batch_number: string | null;
          expiry_date: string | null;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          location_id: number;
          quantity?: number;
          min_quantity?: number;
          max_quantity?: number | null;
          location?: string | null;
          cost_price?: number;
          batch_number?: string | null;
          expiry_date?: string | null;
          last_updated?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock"]["Insert"]>;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: number;
          stock_id: number;
          movement_type: MovementType;
          quantity: number;
          reason: MovementReason;
          reference: string | null;
          notes: string | null;
          user_id: string | null;
          created_at: string;
          quantity_before: number | null;
        };
        Insert: {
          id?: number;
          stock_id: number;
          movement_type: MovementType;
          quantity: number;
          reason: MovementReason;
          reference?: string | null;
          notes?: string | null;
          user_id?: string | null;
          created_at?: string;
          quantity_before?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["stock_movements"]["Insert"]
        >;
        Relationships: [];
      };
      sells: {
        Row: {
          id: number;
          client_id: number;
          data: string;
          total_value: number;
          status: SellStatus;
        };
        Insert: {
          id?: number;
          client_id: number;
          data?: string;
          total_value?: number;
          status?: SellStatus;
        };
        Update: Partial<Database["public"]["Tables"]["sells"]["Insert"]>;
        Relationships: [];
      };
      sell_items: {
        Row: {
          id: number;
          sell_id: number;
          product_id: number;
          quantity: number;
          unitary_price: number | null;
          subtotal: number;
        };
        Insert: {
          id?: number;
          sell_id: number;
          product_id: number;
          quantity: number;
          unitary_price?: number | null;
          subtotal?: number;
        };
        Update: Partial<Database["public"]["Tables"]["sell_items"]["Insert"]>;
        Relationships: [];
      };
      purchases: {
        Row: {
          id: number;
          supplier: string;
          invoice_number: string | null;
          purchase_date: string;
          total_value: number;
          status: PurchaseStatus;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          supplier: string;
          invoice_number?: string | null;
          purchase_date: string;
          total_value?: number;
          status?: PurchaseStatus;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchases"]["Insert"]>;
        Relationships: [];
      };
      purchase_items: {
        Row: {
          id: number;
          purchase_id: number;
          product_id: number;
          quantity: number;
          unit_cost: number;
          subtotal: number;
        };
        Insert: {
          id?: number;
          purchase_id: number;
          product_id: number;
          quantity: number;
          unit_cost: number;
          subtotal?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["purchase_items"]["Insert"]
        >;
        Relationships: [];
      };
      stock_transfers: {
        Row: {
          id: number;
          from_location: string;
          to_location: string;
          product_id: number;
          quantity: number;
          transfer_date: string;
          status: TransferStatus;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          from_location: string;
          to_location: string;
          product_id: number;
          quantity: number;
          transfer_date?: string;
          status?: TransferStatus;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["stock_transfers"]["Insert"]
        >;
        Relationships: [];
      };
      returns: {
        Row: {
          id: number;
          sell_id: number;
          return_date: string;
          reason: ReturnReason;
          status: ReturnStatus;
          notes: string | null;
          processed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          sell_id: number;
          return_date?: string;
          reason: ReturnReason;
          status?: ReturnStatus;
          notes?: string | null;
          processed_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["returns"]["Insert"]>;
        Relationships: [];
      };
      return_items: {
        Row: {
          id: number;
          return_id: number;
          sell_item_id: number;
          quantity: number;
          condition: ProductCondition;
          restock: boolean;
        };
        Insert: {
          id?: number;
          return_id: number;
          sell_item_id: number;
          quantity: number;
          condition: ProductCondition;
          restock?: boolean;
        };
        Update: Partial<
          Database["public"]["Tables"]["return_items"]["Insert"]
        >;
        Relationships: [];
      };
      price_history: {
        Row: {
          id: number;
          stock_id: number;
          cost_price: number;
          changed_by: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          stock_id: number;
          cost_price: number;
          changed_by?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["price_history"]["Insert"]
        >;
        Relationships: [];
      };
      monthly_closings: {
        Row: {
          id: number;
          year: number;
          month: number;
          saldo_resultante: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          year: number;
          month: number;
          saldo_resultante: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["monthly_closings"]["Insert"]
        >;
        Relationships: [];
      };
      locations: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["locations"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      sell_status: SellStatus;
      purchase_status: PurchaseStatus;
      transfer_status: TransferStatus;
      return_status: ReturnStatus;
      movement_type: MovementType;
      movement_reason: MovementReason;
      return_reason: ReturnReason;
      product_condition: ProductCondition;
      product_size: ProductSize;
    };
  };
}

/** Helper: tipo Row de uma tabela */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
/** Helper: tipo Insert de uma tabela */
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
/** Helper: tipo Update de uma tabela */
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
