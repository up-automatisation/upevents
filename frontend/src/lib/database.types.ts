export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: number;
          title: string;
          description: string;
          location: string;
          event_date: string;
          registration_code: string;
          attendance_code: string;
          is_active: boolean;
          is_closed: boolean;
          category_id: number | null;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          description?: string;
          location?: string;
          event_date: string;
          registration_code: string;
          attendance_code: string;
          is_active?: boolean;
          is_closed?: boolean;
          category_id?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          description?: string;
          location?: string;
          event_date?: string;
          registration_code?: string;
          attendance_code?: string;
          is_active?: boolean;
          is_closed?: boolean;
          category_id?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      custom_fields: {
        Row: {
          id: number;
          event_id: number;
          field_name: string;
          field_type: 'text' | 'email' | 'number' | 'select' | 'textarea';
          field_options: any;
          is_required: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          event_id: number;
          field_name: string;
          field_type: 'text' | 'email' | 'number' | 'select' | 'textarea';
          field_options?: any;
          is_required?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          event_id?: number;
          field_name?: string;
          field_type?: 'text' | 'email' | 'number' | 'select' | 'textarea';
          field_options?: any;
          is_required?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      registrations: {
        Row: {
          id: number;
          event_id: number;
          first_name: string;
          last_name: string;
          email: string;
          company: string;
          qr_code: string;
          registered_at: string;
          cancelled: boolean;
          points_earned: number;
        };
        Insert: {
          id?: number;
          event_id: number;
          first_name: string;
          last_name: string;
          email: string;
          company?: string;
          qr_code: string;
          registered_at?: string;
          cancelled?: boolean;
          points_earned?: number;
        };
        Update: {
          id?: number;
          event_id?: number;
          first_name?: string;
          last_name?: string;
          email?: string;
          company?: string;
          qr_code?: string;
          registered_at?: string;
          cancelled?: boolean;
          points_earned?: number;
        };
      };
      registration_data: {
        Row: {
          id: number;
          registration_id: number;
          custom_field_id: number;
          value: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          registration_id: number;
          custom_field_id: number;
          value?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          registration_id?: number;
          custom_field_id?: number;
          value?: string;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: number;
          registration_id: number;
          checked_in_at: string;
          notes: string;
          points_awarded: number;
        };
        Insert: {
          id?: number;
          registration_id: number;
          checked_in_at?: string;
          notes?: string;
          points_awarded?: number;
        };
        Update: {
          id?: number;
          registration_id?: number;
          checked_in_at?: string;
          notes?: string;
          points_awarded?: number;
        };
      };
      participants: {
        Row: {
          id: number;
          email: string;
          first_name: string;
          last_name: string;
          total_points: number;
          level: number;
          events_attended: number;
          streak: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          email: string;
          first_name: string;
          last_name: string;
          total_points?: number;
          level?: number;
          events_attended?: number;
          streak?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          email?: string;
          first_name?: string;
          last_name?: string;
          total_points?: number;
          level?: number;
          events_attended?: number;
          streak?: number;
          created_at?: string;
        };
      };
      participant_badges: {
        Row: {
          id: number;
          participant_id: number;
          badge_type: string;
          badge_name: string;
          earned_at: string;
        };
        Insert: {
          id?: number;
          participant_id: number;
          badge_type: string;
          badge_name: string;
          earned_at?: string;
        };
        Update: {
          id?: number;
          participant_id?: number;
          badge_type?: string;
          badge_name?: string;
          earned_at?: string;
        };
      };
      program_slots: {
        Row: {
          id: number;
          event_id: number;
          start_time: string;
          end_time: string;
          title: string;
          description: string;
          objective: string | null;
          is_break: boolean;
          speaker: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          event_id: number;
          start_time: string;
          end_time: string;
          title: string;
          description?: string;
          objective?: string | null;
          is_break?: boolean;
          speaker?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          event_id?: number;
          start_time?: string;
          end_time?: string;
          title?: string;
          description?: string;
          objective?: string | null;
          is_break?: boolean;
          speaker?: string;
          order_index?: number;
          created_at?: string;
        };
      };
    };
  };
}
