export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_config: {
        Row: {
          id: number;
          brand: string;
          email: string | null;
          socials: Json;
          nav: Json;
          hero: Json;
          updated_at: string;
        };
        Insert: {
          id?: number;
          brand: string;
          email?: string | null;
          socials?: Json;
          nav?: Json;
          hero?: Json;
          updated_at?: string;
        };
        Update: {
          id?: number;
          brand?: string;
          email?: string | null;
          socials?: Json;
          nav?: Json;
          hero?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      sections: {
        Row: {
          id: string;
          type: Database["public"]["Enums"]["section_type"];
          title: string;
          layout: string | null;
          note: string | null;
          page_path: string | null;
          published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          type: Database["public"]["Enums"]["section_type"];
          title: string;
          layout?: string | null;
          note?: string | null;
          page_path?: string | null;
          published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: Database["public"]["Enums"]["section_type"];
          title?: string;
          layout?: string | null;
          note?: string | null;
          page_path?: string | null;
          published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_items: {
        Row: {
          id: string;
          section_id: string;
          slot: Database["public"]["Enums"]["media_slot"];
          type: Database["public"]["Enums"]["media_type"];
          storage_path: string | null;
          legacy_url: string | null;
          thumbnail_path: string | null;
          thumbnail_legacy_url: string | null;
          title: string | null;
          alt_text: string | null;
          featured: boolean;
          width: number | null;
          height: number | null;
          duration_seconds: number | null;
          file_size: number | null;
          mime_type: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          slot?: Database["public"]["Enums"]["media_slot"];
          type: Database["public"]["Enums"]["media_type"];
          storage_path?: string | null;
          legacy_url?: string | null;
          thumbnail_path?: string | null;
          thumbnail_legacy_url?: string | null;
          title?: string | null;
          alt_text?: string | null;
          featured?: boolean;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
          file_size?: number | null;
          mime_type?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          slot?: Database["public"]["Enums"]["media_slot"];
          type?: Database["public"]["Enums"]["media_type"];
          storage_path?: string | null;
          legacy_url?: string | null;
          thumbnail_path?: string | null;
          thumbnail_legacy_url?: string | null;
          title?: string | null;
          alt_text?: string | null;
          featured?: boolean;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
          file_size?: number | null;
          mime_type?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_items_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          }
        ];
      };
      team_members: {
        Row: {
          id: string;
          name: string;
          roles: string;
          photo_path: string | null;
          photo_legacy_url: string | null;
          photo_position: string | null;
          skills: string[];
          is_featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          roles?: string;
          photo_path?: string | null;
          photo_legacy_url?: string | null;
          photo_position?: string | null;
          skills?: string[];
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          roles?: string;
          photo_path?: string | null;
          photo_legacy_url?: string | null;
          photo_position?: string | null;
          skills?: string[];
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      partners: {
        Row: {
          id: string;
          name: string;
          logo_path: string | null;
          logo_legacy_url: string | null;
          tier: Database["public"]["Enums"]["partner_tier"];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_path?: string | null;
          logo_legacy_url?: string | null;
          tier: Database["public"]["Enums"]["partner_tier"];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_path?: string | null;
          logo_legacy_url?: string | null;
          tier?: Database["public"]["Enums"]["partner_tier"];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      section_type: "home" | "gallery" | "team" | "partners";
      media_type: "image" | "video";
      media_slot: "gallery" | "hero" | "home_stack";
      partner_tier: "main" | "secondary";
    };
    CompositeTypes: Record<string, never>;
  };
};
