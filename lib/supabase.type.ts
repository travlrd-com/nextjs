import { Database } from "./database.types";

export type DB<Type extends "Insert" | "Relationships" | "Row" | "Update", TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName][Type];