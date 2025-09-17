import { pgTable, unique } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/user";
import { AdapterAccountType } from "next-auth/adapters";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

export const account = pgTable("account", (t) => ({
    id: t.text("acc_id")
      .primaryKey()
      .$default(nanoid),
    userId: t.text("acc_holder")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade"
      })
      .unique(),
    type: t.text("acc_type").$type<AdapterAccountType>().notNull(),
    provider: t.text("acc_provider").notNull(),
    providerAccountId: t.text("acc_provider_account_id").notNull(),
    refresh_token: t.text("acc_refresh_token"),
    access_token: t.text("acc_access_token"),
    expires_at: t.integer("acc_expires_at"),
    token_type: t.text("acc_token_type"),
    scope: t.text("acc_scope"),
    id_token: t.text("acc_id_token"),
    session_state: t.text("acc_session_state"),
  }), (t) => [
    unique().on(t.provider, t.providerAccountId)
  ]
);

export const emailVerification = pgTable("email_verification", (t) => ({
  id: t.text("verify_id")
    .primaryKey()
    .$default(nanoid),
  email: t.text("verify_email")
    .notNull()
    .unique()
    .references(() => user.email, {
      onDelete: "cascade"
    }),
  code: t.text("verify_code").notNull(),
  expiration: t.timestamp("verify_expiration",
    { mode: "date" }
  ).notNull()
}));

export const passwordReset = pgTable("password_reset", (t) => ({
  id: t.text("pr_id")
    .primaryKey()
    .$default(nanoid),
  email: t.text("pr_email")
    .notNull()
    .unique()
    .references(() => user.email, {
      onDelete: "cascade"
    }),
  code: t.text("pr_code").notNull(),
  expiration: t.timestamp("pr_expiration", { 
    mode: "date"
  }).notNull()
}));

export const session = pgTable("session", (t) => ({
  sessionToken: t.text("session_token").primaryKey(),
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  expires: t.timestamp("session_expires", { mode: "date" }).notNull(),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
  })
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  })
}));

export const emailVerificationRelations = relations(emailVerification, ({ one }) => ({
  user: one(user, {
    fields: [emailVerification.email],
    references: [user.email]
  })
}));

export const passwordResetRelations = relations(passwordReset, ({ one }) => ({
  user: one(user, {
    fields: [passwordReset.email],
    references: [user.email]
  })
}));
