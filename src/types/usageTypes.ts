export interface ItemUsageDetail {
    settings: { id: string; name: string }[];
    characters: { name: string; player: string; settingName?: string }[];
}
