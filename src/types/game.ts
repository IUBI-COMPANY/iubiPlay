// Domain unions
export type GameStatus = "draft" | "published" | "archived";

export type GamePlatform = "web" | "android" | "ios" | "windows" | "mac";

export type GameDevice = "pc" | "tablet" | "mobile" | "interactive_display";

export type GameOpenMode = "new_tab" | "same_tab";

export type GameLinkType = "direct" | "affiliate" | "partner";

export type GamePricing = "free" | "freemium" | "paid";

// Main entity
export interface Game {
    id: string; // uuid

    // basic info
    title: string;
    slug: string;

    short_description?: string;
    description?: string;

    category_id?: string;
    tags?: string[];

    // redirect
    redirect_url: string;
    open_mode?: GameOpenMode;
    link_type?: GameLinkType;

    // media
    cover_image_url: string;
    hero_image_url?: string;
    icon_url?: string;
    screenshots?: string[];

    // compatibility
    platform: GamePlatform;
    devices?: GameDevice[];

    age_min?: number;
    age_max?: number;

    grade_min?: number;
    grade_max?: number;

    // provider
    provider_name?: string;
    provider_url?: string;

    // pricing
    pricing?: GamePricing;

    // featured
    is_featured?: boolean;
    featured_order?: number;

    // sorting
    sort_order?: number;

    // status
    status: GameStatus;

    // timestamps
    created_at: string;
    updated_at: string;

    created_by?: string;
    updated_by?: string;

    is_deleted?: boolean;
}

// Backward-compatible aliases (legacy naming)
export type game_status = GameStatus;
export type game_platform = GamePlatform;
export type game_device = GameDevice;
export type game_open_mode = GameOpenMode;
export type game_link_type = GameLinkType;
export type game_pricing = GamePricing;
export type game = Game;
