// Hand-written to match supabase/migrations/*.sql, and to the exact shape
// @supabase/postgrest-js's GenericTable/GenericSchema expect (Relationships
// on every table, Views/Functions/Enums on the schema) -- omitting those
// makes every query silently infer `never` instead of a real row type.
// Once you have a live Supabase project (local or hosted), regenerate this
// from the real schema instead of maintaining it by hand:
//   supabase gen types typescript --local > lib/supabase/types.ts

export type UserRole = "super_admin" | "admin" | "driver";

export type OrderStatus =
  | "unassigned"
  | "assigned"
  | "confirmed"
  | "loaded"
  | "delivered"
  | "completed";

export type ExpenseType = "tfn" | "diesel" | "overnight" | "truck_wash" | "oil";

export type ExpenseStatus = "pending" | "approved" | "rejected";

export type DocumentType = "loading_document" | "delivery_document" | "pod" | "receipt";

export type NotificationType =
  | "load_assigned"
  | "order_status_changed"
  | "expense_approved"
  | "expense_rejected";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          active: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string | null;
          drivers_license: string | null;
          pdp_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["drivers"]["Row"]> & {
          user_id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["drivers"]["Row"]>;
        Relationships: [];
      };
      trucks: {
        Row: {
          id: string;
          registration: string;
          make_model: string | null;
          max_capacity_tons: number | null;
          active: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["trucks"]["Row"]> & {
          registration: string;
        };
        Update: Partial<Database["public"]["Tables"]["trucks"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          pickup_address: string;
          pickup_lat: number | null;
          pickup_lng: number | null;
          delivery_address: string;
          delivery_lat: number | null;
          delivery_lng: number | null;
          pickup_date: string;
          delivery_date: string;
          weight_tons: number;
          truck_id: string;
          loading_number: string | null;
          notes: string | null;
          status: OrderStatus;
          driver_id: string | null;
          begin_km: number | null;
          end_km: number | null;
          offload_pin: string | null;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          customer_name: string;
          pickup_address: string;
          delivery_address: string;
          pickup_date: string;
          delivery_date: string;
          weight_tons: number;
          truck_id: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: OrderStatus;
          to_status: OrderStatus;
          changed_by: string | null;
          notes: string | null;
          changed_at: string;
        };
        Insert: never; // written only by the enforce_order_status_transition trigger
        Update: never;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          driver_id: string;
          order_id: string | null;
          type: ExpenseType;
          amount: number;
          currency: string;
          expense_date: string;
          notes: string | null;
          status: ExpenseStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["expenses"]["Row"]> & {
          driver_id: string;
          type: ExpenseType;
          amount: number;
          expense_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Row"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          order_id: string | null;
          expense_id: string | null;
          type: DocumentType;
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          type: DocumentType;
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          uploaded_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          related_order_id: string | null;
          related_expense_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & {
          action: string;
          target_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      expense_type: ExpenseType;
      expense_status: ExpenseStatus;
      document_type: DocumentType;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
