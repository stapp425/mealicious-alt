"use server";

import { redis } from "@/lib/redis";
import { UTCDate } from "@date-fns/utc";
import { differenceInSeconds } from "date-fns";
import z from "zod/v4";

export async function getDataFromKey<T>({ key, schema }: { key: string; schema: z.ZodType<T>; }) {
  const result = await redis.get(key);
  return result ? schema.parse(JSON.parse(result)) : result;
}

export async function getCachedData<T extends z.ZodType>({
  schema,
  cacheKey,
  call,
  timeToLive
}: {
  schema: T;
  cacheKey: string;
  call: () => Promise<z.input<T>>;
  timeToLive?: number | Date;
}): Promise<z.infer<T>> {
  const cachedResult = await redis.get(cacheKey);

  if (cachedResult) return schema.parse(JSON.parse(cachedResult));

  const databaseResult = await call();

  if (!timeToLive) {
    await redis.set(
      cacheKey,
      JSON.stringify(databaseResult),
    );

    return schema.parse(databaseResult);
  }
  
  await redis.set(
    cacheKey,
    JSON.stringify(databaseResult),
    "EX", typeof timeToLive === "number" ? timeToLive : differenceInSeconds(timeToLive, new UTCDate())
  );

  return schema.parse(databaseResult);
}

export async function removeCacheKeys(pattern: string) {
  let count = "0";
  const keys: string[] = [];
  
  do {
    const [cursor, foundKeys] = await redis.scan(count, "MATCH", pattern, "COUNT", 100);
    count = cursor;
    keys.push(...foundKeys);
  } while (count !== "0");
  
  if (keys.length > 0) await redis.unlink(keys);
}
