import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const transactionTypeEnum = pgEnum("transaction_type", ["c", "d"]);

export const clients = pgTable("clients", {
  id: serial("id").notNull().primaryKey(),
  balance: integer("balance").notNull().default(0),
  limit: integer("limit").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").notNull().primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  amount: integer("amount").notNull(),
  type: transactionTypeEnum("transaction_type").notNull(),
  description: varchar("description", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
