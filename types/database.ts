export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          pseudo: string
          avatar_url: string | null
          score: number
          created_at: string
        }
        Insert: {
          id: string
          pseudo: string
          avatar_url?: string | null
          score?: number
        }
        Update: {
          pseudo?: string
          avatar_url?: string | null
          score?: number
        }
      }
      stories: {
        Row: {
          id: string
          title: string
          opening: string
          mode: 'blind' | 'full'
          max_turns: number
          turn_duration: number
          visibility: 'public' | 'private'
          status: 'open' | 'in_progress' | 'finished'
          cover_url: string | null
          owner_id: string
          current_turn: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stories']['Row'], 'id' | 'created_at' | 'current_turn' | 'status'>
        Update: Partial<Database['public']['Tables']['stories']['Insert']>
      }
      contributions: {
        Row: {
          id: string
          story_id: string
          user_id: string
          content: string
          is_canon: boolean
          turn_number: number
          vote_count: number
          created_at: string
        }
        Insert: {
          story_id: string
          user_id: string
          content: string
          turn_number: number
        }
        Update: {
          is_canon?: boolean
          vote_count?: number
        }
      }
      votes: {
        Row: {
          id: string
          contribution_id: string
          user_id: string
          story_id: string
          turn_number: number
          created_at: string
        }
        Insert: {
          contribution_id: string
          user_id: string
          story_id: string
          turn_number: number
        }
        Update: never
      }
    }
  }
}

export type UserRow = Database['public']['Tables']['users']['Row']
export type StoryRow = Database['public']['Tables']['stories']['Row']
export type ContributionRow = Database['public']['Tables']['contributions']['Row']
export type VoteRow = Database['public']['Tables']['votes']['Row']