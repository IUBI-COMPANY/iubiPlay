export interface UserClass {
  id: string; // uuid
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserClassGame {
  id: string; // uuid
  class_id: string;
  game_id: string;
  added_at: string;
}
