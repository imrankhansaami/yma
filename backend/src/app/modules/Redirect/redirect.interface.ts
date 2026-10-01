import { Types } from "mongoose";

export interface IRedirect {
  _id?: Types.ObjectId;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
  isActive: boolean;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateRedirectData {
  fromPath: string;
  toPath: string;
  statusCode?: 301 | 302;
  isActive?: boolean;
  note?: string;
}

export interface UpdateRedirectData {
  fromPath?: string;
  toPath?: string;
  statusCode?: 301 | 302;
  isActive?: boolean;
  note?: string;
}

export interface RedirectFilters {
  isActive?: string;
  search?: string;
}
