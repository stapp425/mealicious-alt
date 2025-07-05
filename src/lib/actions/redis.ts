"use server";

import { redis } from "@/redis";
import { ZodType } from "zod";

export async function getDataWithCache<T>({ schema, cacheKey, call, timeToLive }: {
  schema: ZodType<T>;
  cacheKey: string;
  call: () => Promise<T>;
  timeToLive?: number;
}): Promise<T> {
  const cachedResult = await redis.get(cacheKey);

  if (cachedResult) {
    const parsedCachedResult = schema.parse(JSON.parse(cachedResult));
    return parsedCachedResult;
  }

  const databaseResult = await call();

  if (timeToLive) {
    await redis.set(
      cacheKey,
      JSON.stringify(databaseResult),
      "EX", timeToLive
    );
  } else {
    await redis.set(
      cacheKey,
      JSON.stringify(databaseResult),
    );
  }

  return databaseResult;
}

export async function removeCacheKeys(pattern: string) {
  let count = "0";
  const keys: string[] = [];
  
  do {
    const [cursor, foundKeys] = await redis.scan(count, "MATCH", pattern, "COUNT", 100);
    count = cursor;
    keys.push(...foundKeys);
  } while (count !== "0");
  
  await redis.unlink(keys);
}
