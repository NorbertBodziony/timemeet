/* eslint-disable */
/**
 * Generated data model types.
 *
 * Hand-authored stand-in for `npx convex dev` output (no network in this env).
 * Regenerated identically by Convex when run on a networked machine.
 */
import type {
  DataModelFromSchemaDefinition,
  DocumentByName,
  TableNamesInDataModel,
  SystemTableNames,
} from "convex/server";
import type { GenericId } from "convex/values";
import schema from "../schema.js";

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;

export type TableNames = TableNamesInDataModel<DataModel>;

export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>;

export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;
