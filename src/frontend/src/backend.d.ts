import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Filters {
    blur: boolean;
    sepia: boolean;
    blackAndWhite: boolean;
    invert: boolean;
    grayscale: boolean;
}
export interface Preference {
    filters: Filters;
    defaultResolution: [bigint, bigint];
}
export interface backendInterface {
    getAllPreferences(): Promise<Array<Preference>>;
    getDefaultPreferences(): Promise<Preference>;
    getUserPreference(): Promise<Preference>;
    setUserPreference(preference: Preference): Promise<void>;
}
