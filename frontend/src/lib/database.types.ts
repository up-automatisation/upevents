export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          location: string;
          event_date: string;
          registration_code: string;
          attendance_code: string;
          is_active: boolean;
          is_closed: boolean;
          category_id: string | null;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          location?: string;
          event_date: string;
          registration_code: string;
          attendance_code: string;
          is_active?: boolean;
          is_closed?: boolean;
          category_id?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location?: string;
          event_date?: string;
          registration_code?: string;
          attendance_code?: string;
          is_active?: boolean;
          is_closed?: boolean;
          category_id?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      custom_fields: {
        Row: {
          id: string;
          event_id: string;
          field_name: string;
          field_type: 'text' | 'email' | 'number' | 'select' | 'textarea';
          field_options: any;
          is_required: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          field_name: string;
          field_type: 'text' | 'email' | 'number' | 'select' | 'textarea';
          field_options?: any;
          is_required?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
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
          id: string;
          event_id: string;
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
          id?: string;
          event_id: string;
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
          id?: string;
          event_id?: string;
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
          id: string;
          registration_id: string;
          custom_field_id: string;
          value: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          custom_field_id: string;
          value?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          custom_field_id?: string;
          value?: string;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          registration_id: string;
          checked_in_at: string;
          notes: string;
          points_awarded: number;
        };
        Insert: {
          id?: string;
          registration_id: string;
          checked_in_at?: string;
          notes?: string;
          points_awarded?: number;
        };
        Update: {
          id?: string;
          registration_id?: string;
          checked_in_at?: string;
          notes?: string;
          points_awarded?: number;
        };
      };
      participants: {
        Row: {
          id: string;
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
          id?: string;
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
          id?: string;
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
          id: string;
          participant_id: string;
          badge_type: string;
          badge_name: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          badge_type: string;
          badge_name: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string;
          badge_type?: string;
          badge_name?: string;
          earned_at?: string;
        };
      };
      program_slots: {
        Row: {
          id: string;
          event_id: string;
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
          id?: string;
          event_id: string;
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
          id?: string;
          event_id?: string;
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
