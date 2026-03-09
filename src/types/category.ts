// Domain unions
export type CategoryType = "level" | "course";

// Main entity
export interface Category {
    id: string; // uuid
    name: string;
    slug: string;
    type: CategoryType;

    description?: string;
    icon?: string;
    is_active?: boolean;
    sort_order?: number;

    created_at: string;
    updated_at: string;
}

// Join table entity for many-to-many selection
export interface GameCategory {
    game_id: string; // uuid
    category_id: string; // uuid
    created_at?: string;
}

// Helper shape for UI selections
export interface CategorySelections {
    levels: string[]; // category ids
    courses: string[]; // category ids
}

// Backward-compatible aliases
export type category_type = CategoryType;
export type category = Category;
