"use server";

import { db } from "@/db";

export async function getMatchingEmail(email: string) {
  return db.query.user.findFirst({
    where: (user, { eq, sql }) => eq(sql`lower(${user.email})`, email.toLowerCase()),
    columns: {
      email: true
    }
  });
}

export async function getMatchingName(name: string) {
  return db.query.user.findFirst({
    where: (user, { eq, sql }) => eq(sql`lower(${user.name})`, name.toLowerCase()),
    columns: {
      name: true
    }
  });
}
