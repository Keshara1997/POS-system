export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          auto_backup: boolean | null
          created_at: string | null
          currency: string | null
          id: string
          interface_mode: string | null
          invoice_counter: number | null
          invoice_prefix: string | null
          receipt_printer: boolean | null
          store_address: string | null
          store_email: string | null
          store_logo: string | null
          store_name: string | null
          store_phone: string | null
          tax_rate: number | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          auto_backup?: boolean | null
          created_at?: string | null
          currency?: string | null
          id?: string
          interface_mode?: string | null
          invoice_counter?: number | null
          invoice_prefix?: string | null
          receipt_printer?: boolean | null
          store_address?: string | null
          store_email?: string | null
          store_logo?: string | null
          store_name?: string | null
          store_phone?: string | null
          tax_rate?: number | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_backup?: boolean | null
          created_at?: string | null
          currency?: string | null
          id?: string
          interface_mode?: string | null
          invoice_counter?: number | null
          invoice_prefix?: string | null
          receipt_printer?: boolean | null
          store_address?: string | null
          store_email?: string | null
          store_logo?: string | null
          store_name?: string | null
          store_phone?: string | null
          tax_rate?: number | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          credit_limit: number | null
          credit_used: number | null
          email: string | null
          id: string
          last_purchase: string | null
          name: string
          phone: string | null
          price_tier: string | null
          total_purchases: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_used?: number | null
          email?: string | null
          id?: string
          last_purchase?: string | null
          name: string
          phone?: string | null
          price_tier?: string | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_used?: number | null
          email?: string | null
          id?: string
          last_purchase?: string | null
          name?: string
          phone?: string | null
          price_tier?: string | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      discounts: {
        Row: {
          active: boolean | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          free_gift_products: string[] | null
          id: string
          max_discount: number | null
          min_amount: number | null
          name: string
          type: string
          updated_at: string | null
          valid_days: number[] | null
          valid_from: string
          valid_to: string
          value: number | null
        }
        Insert: {
          active?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          free_gift_products?: string[] | null
          id?: string
          max_discount?: number | null
          min_amount?: number | null
          name: string
          type: string
          updated_at?: string | null
          valid_days?: number[] | null
          valid_from: string
          valid_to: string
          value?: number | null
        }
        Update: {
          active?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          free_gift_products?: string[] | null
          id?: string
          max_discount?: number | null
          min_amount?: number | null
          name?: string
          type?: string
          updated_at?: string | null
          valid_days?: number[] | null
          valid_from?: string
          valid_to?: string
          value?: number | null
        }
        Relationships: []
      }
      product_batches: {
        Row: {
          batch_number: string
          cost_price: number | null
          created_at: string | null
          expiry_date: string | null
          id: string
          manufacturing_date: string | null
          product_id: string | null
          quantity: number | null
          supplier_info: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          product_id?: string | null
          quantity?: number | null
          supplier_info?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          product_id?: string | null
          quantity?: number | null
          supplier_info?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          active: boolean | null
          barcode: string | null
          category: string
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_weight_based: boolean | null
          min_stock: number | null
          name: string
          price: number | null
          price_per_unit: number | null
          sku: string
          stock: number | null
          taxable: boolean | null
          track_inventory: boolean | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          barcode?: string | null
          category: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_weight_based?: boolean | null
          min_stock?: number | null
          name: string
          price?: number | null
          price_per_unit?: number | null
          sku: string
          stock?: number | null
          taxable?: boolean | null
          track_inventory?: boolean | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          barcode?: string | null
          category?: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_weight_based?: boolean | null
          min_stock?: number | null
          name?: string
          price?: number | null
          price_per_unit?: number | null
          sku?: string
          stock?: number | null
          taxable?: boolean | null
          track_inventory?: boolean | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          applied_discounts: Json | null
          card_details: Json | null
          cashier: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          discount_amount: number | null
          free_gifts: Json | null
          id: string
          invoice_number: string
          items: Json
          notes: string | null
          payment_method: string | null
          receipt_number: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          applied_discounts?: Json | null
          card_details?: Json | null
          cashier?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          free_gifts?: Json | null
          id?: string
          invoice_number: string
          items: Json
          notes?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          applied_discounts?: Json | null
          card_details?: Json | null
          cashier?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          free_gifts?: Json | null
          id?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      sales_tabs: {
        Row: {
          cart: Json | null
          created_at: string | null
          id: string
          name: string
          selected_customer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cart?: Json | null
          created_at?: string | null
          id?: string
          name: string
          selected_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cart?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          selected_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_tabs_selected_customer_id_fkey"
            columns: ["selected_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tabs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          payment_terms: string | null
          phone: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          active: boolean | null
          avatar: string | null
          created_at: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          permissions: string[] | null
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          active?: boolean | null
          avatar?: string | null
          created_at?: string | null
          email: string
          id: string
          last_login?: string | null
          name: string
          permissions?: string[] | null
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          active?: boolean | null
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          permissions?: string[] | null
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
