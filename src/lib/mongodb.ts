import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cache;

/**
 * Cached MongoDB connection. Safe to call from every Server Component,
 * Server Action and Route Handler — mongoose.connect() is a no-op when
 * already connected, and the global cache survives dev hot reloads.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: "ultraagent",
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export function toObject<T>(doc: T): T {
  if (doc && typeof doc === "object" && "toObject" in doc) {
    return (doc as { toObject: () => T }).toObject();
  }
  return doc;
}

export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
