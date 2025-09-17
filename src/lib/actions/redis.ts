"use server";

import { redis } from "@/lib/redis";
import { differenceInSeconds } from "date-fns";
import z from "zod/v4";

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
}): Promise<z.output<T>> {
  const cachedResult = await redis.get(cacheKey);

  if (cachedResult) {
    if (timeToLive) {
      // refresh the time to live of the cache
      await redis.expire(
        cacheKey,
        typeof timeToLive === "number"
          ? timeToLive
          : differenceInSeconds(timeToLive, new Date())
      );
    }
      
    return schema.parse(JSON.parse(cachedResult));
  }

  const databaseResult = await call();

  if (!timeToLive) {
    // safely parse the input while ignoring the output type when inserting into the cache
    const validatedDatabaseResult = await schema.safeParseAsync(databaseResult);
    if (validatedDatabaseResult.error) throw validatedDatabaseResult.error;
    
    await redis.set(
      cacheKey,
      JSON.stringify(databaseResult)
    );

    return validatedDatabaseResult.data;
  }
  
  // safely parse the input while ignoring the output type when inserting into the cache
  const validatedDatabaseResult = await schema.safeParseAsync(databaseResult);
  if (validatedDatabaseResult.error) throw validatedDatabaseResult.error;

  await redis.set(
    cacheKey,
    JSON.stringify(databaseResult),
    "EX", typeof timeToLive === "number" ? timeToLive : differenceInSeconds(timeToLive, new Date())
  );

  return validatedDatabaseResult.data;
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
