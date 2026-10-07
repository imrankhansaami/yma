import { Document, Types } from "mongoose";

export interface IDeliveryArea {
  _id?: Types.ObjectId;
  name: string;
  postcode: string;
  deliveryFee: number;
  isFree: boolean;
  minOrder: number;
  estimatedTime: number;
  isActive: boolean;
}

export interface IDeliveryOptions {
  isAvailable: boolean;
  isFree: boolean;
  fee: number;
  minOrder: number;
  estimatedTime: number;
  radius: number; // in meters
}

export interface ILocation extends Document {
  name: string;
  slug?: string;
  slugAliases?: string[];
  type: "country" | "state" | "city" | "area" | "postcode";
  parent: Types.ObjectId | null;
  children?: Types.ObjectId[];

  country?: string;
  state?: string;
  city?: string;
  area?: string;
  postcode?: string;
  deliveryAreas: IDeliveryArea[];
  deliveryOptions?: IDeliveryOptions; // Delivery options for this location
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
  /** Google Maps query for this page's map: a place, a full address, or "lat,lng". */
  mapQuery?: string;
  /** Google Maps zoom level (1-21). */
  mapZoom?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// Service inputs
export interface ICreateLocationData {
  name: string;
  slug?: string;
  slugAliases?: string[];
  type: "country" | "state" | "city" | "area" | "postcode";
  parent?: string | null;
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  postcode?: string;
  deliveryAreas?: IDeliveryArea[];
  deliveryOptions?: IDeliveryOptions;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
  mapQuery?: string;
  mapZoom?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface IUpdateLocationData extends Partial<ICreateLocationData> {}

export interface ICreateDeliveryAreaData {
  name: string;
  postcode: string;
  deliveryFee: number;
  isFree?: boolean;
  minOrder: number;
  estimatedTime: number;
  isActive?: boolean;
}

export interface IUpdateDeliveryAreaData extends Partial<ICreateDeliveryAreaData> {}

export interface ILocationFilters {
  search?: string;
  type?: "country" | "state" | "city" | "area" | "postcode";
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  postcode?: string;
  parent?: string | null;
  hasDeliveryAreas?: "true" | "false";
  isActive?: "true" | "false";
  /** Set to "true" to include retired locations (storefront hides them). */
  includeInactive?: "true" | "false";
}

export interface IDeliveryCheckResult {
  available: boolean;
  location?: {
    name: string;
    type: "country" | "state" | "city" | "area" | "postcode";
    state?: string;
    city?: string;
  };
  deliveryArea?: IDeliveryArea;
  deliveryOptions?: IDeliveryOptions;
  meetsMinOrder?: boolean;
  message: string;
}
