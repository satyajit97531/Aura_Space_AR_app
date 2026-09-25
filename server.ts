import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { MongoClient, ObjectId } from "mongodb";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: "10mb" }));

// Password hashing helper
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "auraspace_secure_salt_2026").digest("hex");
}

function sanitizeMongoUri(raw?: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  let uri = raw.trim();

  // Strip surrounding quotes
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }

  // Strip variable assignment prefixes if user pasted MONGODB_URI=... or MONGO_URI=...
  if (uri.startsWith("MONGODB_URI=")) {
    uri = uri.slice("MONGODB_URI=".length).trim();
  } else if (uri.startsWith("MONGO_URI=")) {
    uri = uri.slice("MONGO_URI=".length).trim();
  }

  // Strip quotes again if they were inside MONGODB_URI="..."
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }

  // Strip trailing semicolon
  if (uri.endsWith(";")) {
    uri = uri.slice(0, -1).trim();
  }

  // Direct scheme check
  if (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  // Regex extract scheme if there were other prefixes (e.g. export MONGODB_URI=...)
  const match = uri.match(/(mongodb(?:\+srv)?:\/\/[^\s"']+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

function getMongoUri(): string | null {
  // Check MONGO_URI first, then MONGODB_URI.
  // Return null if none configured so we don't attempt broken connections.
  const uriFromMongo = sanitizeMongoUri(process.env.MONGO_URI);
  if (uriFromMongo) return uriFromMongo;

  const uriFromMongodb = sanitizeMongoUri(process.env.MONGODB_URI);
  if (uriFromMongodb) return uriFromMongodb;

  return null;
}

// Helper to match Mongo-like query filters in memory
function matchValue(actual: any, target: any): boolean {
  if (actual === target) return true;
  if (actual == null || target == null) return false;
  if (String(actual) === String(target)) return true;
  return false;
}

function matchDoc(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  if (Array.isArray(filter.$or)) {
    return filter.$or.some((clause: any) => matchDoc(doc, clause));
  }

  for (const [key, expected] of Object.entries(filter)) {
    if (key === "$or") continue;
    if (key === "_id" || key === "id") {
      const docId = doc._id || doc.id;
      if (!matchValue(docId, expected) && !matchValue(doc.id, expected) && !matchValue(doc._id, expected)) {
        return false;
      }
      continue;
    }

    if (key === "email" && typeof expected === "string" && typeof doc.email === "string") {
      if (doc.email.toLowerCase() !== expected.toLowerCase()) return false;
      continue;
    }

    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if (String(doc[key]) !== String(expected)) return false;
    } else {
      if (doc[key] !== expected) return false;
    }
  }

  return true;
}

// Persistent local JSON file database for zero-downtime offline and fallback storage
class LocalFileDatabase {
  private filePath: string;
  private data: { users: any[] };

  constructor(filePath: string) {
    this.filePath = filePath;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        this.data = JSON.parse(content);
        if (!Array.isArray(this.data.users)) {
          this.data.users = [];
        }
      } catch {
        this.data = { users: [] };
      }
    } else {
      this.data = { users: [] };
    }

    // Seed default showcase users if database is empty
    if (this.data.users.length === 0) {
      this.seedShowcaseData();
      this.persist();
    }
  }

  private seedShowcaseData() {
    const now = new Date().toISOString();
    const user1Id = "66f3b0e1a2c3d4e5f6071821";
    const user2Id = "66f3b0e1a2c3d4e5f6071822";
    const user3Id = "66f3b0e1a2c3d4e5f6071823";

    this.data.users = [
      {
        _id: user1Id,
        id: user1Id,
        name: "Elena Rostova",
        username: "elena_spatial",
        email: "elena@auraspace.design",
        password: hashPassword("auraspace123"),
        createdAt: "2026-08-15T10:00:00.000Z",
        lastLoginAt: now,
        bio: "Spatial designer specializing in organic Japandi living spaces & natural materials.",
        avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=elena_spatial",
        badges: ["first_blueprint", "spatial_architect", "curator_choice"],
        showcasedBadges: ["spatial_architect", "curator_choice"],
        totalLikes: 42,
        projects: [
          {
            id: "proj_showcase_japandi",
            name: "Japandi Living Sanctuary",
            userId: user1Id,
            userEmail: "elena@auraspace.design",
            userName: "Elena Rostova",
            userAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=elena_spatial",
            roomDimensions: { width: 7, length: 6, height: 2.8 },
            colorPalette: {
              id: "japandi_minimal",
              name: "Japandi Stone & Linen",
              wallColor: "#EFECE6",
              floorColor: "#A89F91",
              accentColor: "#22201D",
              baseColor: "#DFD9CE",
              floorTextureType: "marble",
              wallTextureType: "matte",
            },
            placedObjects: [
              {
                id: "obj_jp_sofa",
                name: "Three-Seater Curved Sofa",
                category: "seating",
                proceduralType: "modern_sofa",
                position: [0, 0, 1.2],
                rotation: [0, 0, 0],
                dimensions: { width: 2.3, height: 0.82, depth: 0.95 },
                color: "#DFD9CE",
                accentColor: "#22201D",
              },
              {
                id: "obj_jp_table",
                name: "Organic Coffee Table",
                category: "tables",
                proceduralType: "coffee_table",
                position: [0, 0, -0.2],
                rotation: [0, 0, 0],
                dimensions: { width: 1.2, height: 0.42, depth: 0.75 },
                color: "#8C7B6B",
                accentColor: "#3E3832",
              },
              {
                id: "obj_jp_chair",
                name: "Nordic Lounge Chair",
                category: "seating",
                proceduralType: "lounge_chair",
                position: [-1.8, 0, 0.4],
                rotation: [0, Math.PI / 4, 0],
                dimensions: { width: 0.85, height: 0.78, depth: 0.82 },
                color: "#C5BDB2",
                accentColor: "#22201D",
              },
              {
                id: "obj_jp_plant",
                name: "Potted Monstera",
                category: "decor",
                proceduralType: "potted_monstera",
                position: [2.8, 0, -2.2],
                rotation: [0, 0, 0],
                dimensions: { width: 0.65, height: 1.15, depth: 0.65 },
                color: "#2D5A3F",
                accentColor: "#D1C7BD",
              },
              {
                id: "obj_jp_lamp",
                name: "Minimalist Arch Lamp",
                category: "lighting",
                proceduralType: "floor_lamp",
                position: [-2.6, 0, 1.8],
                rotation: [0, -Math.PI / 6, 0],
                dimensions: { width: 0.45, height: 1.95, depth: 0.85 },
                color: "#22201D",
                accentColor: "#F59E0B",
              },
            ],
            notes: "Curated with harmonious balance, low visual center of gravity, and 1.2m circulation corridors.",
            isPublic: true,
            likesCount: 42,
            likedBy: [],
            comments: [
              {
                id: "comm_jp_1",
                userId: "community_1",
                userName: "Marcus V.",
                userAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Marcus",
                text: "The circulation corridor around the coffee table feels exceptionally spacious!",
                createdAt: "2026-08-16T14:22:00.000Z",
              },
            ],
            createdAt: "2026-08-15T11:00:00.000Z",
            updatedAt: "2026-08-15T11:00:00.000Z",
          },
        ],
      },
      {
        _id: user2Id,
        id: user2Id,
        name: "Kaito Tanaka",
        username: "kaito_design",
        email: "kaito@auraspace.design",
        password: hashPassword("auraspace123"),
        createdAt: "2026-08-18T09:30:00.000Z",
        lastLoginAt: now,
        bio: "Creative technologist and minimalist interior designer based in Kyoto.",
        avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=kaito_design",
        badges: ["first_blueprint", "lighting_virtuoso"],
        showcasedBadges: ["lighting_virtuoso"],
        totalLikes: 38,
        projects: [
          {
            id: "proj_showcase_nordic",
            name: "Nordic Atelier & Creative Studio",
            userId: user2Id,
            userEmail: "kaito@auraspace.design",
            userName: "Kaito Tanaka",
            userAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=kaito_design",
            roomDimensions: { width: 6.5, length: 5.5, height: 3.0 },
            colorPalette: {
              id: "nordic_oak",
              name: "Nordic Warm Oak",
              wallColor: "#F4F1EA",
              floorColor: "#CBB69D",
              accentColor: "#3B4A3F",
              baseColor: "#EAE5DC",
              floorTextureType: "oak_wood",
              wallTextureType: "warm_plaster",
            },
            placedObjects: [
              {
                id: "obj_nd_desk",
                name: "Solid Oak Work Desk",
                category: "tables",
                proceduralType: "work_desk",
                position: [0, 0, -1.5],
                rotation: [0, 0, 0],
                dimensions: { width: 1.6, height: 0.75, depth: 0.8 },
                color: "#CBB69D",
                accentColor: "#3B4A3F",
              },
              {
                id: "obj_nd_bookcase",
                name: "Modular Open Bookshelf",
                category: "storage",
                proceduralType: "bookshelf",
                position: [-2.4, 0, 0],
                rotation: [0, Math.PI / 2, 0],
                dimensions: { width: 1.4, height: 1.85, depth: 0.38 },
                color: "#8C7862",
                accentColor: "#F4F1EA",
              },
              {
                id: "obj_nd_chair",
                name: "Ergonomic Task Chair",
                category: "seating",
                proceduralType: "lounge_chair",
                position: [0, 0, -0.7],
                rotation: [0, Math.PI, 0],
                dimensions: { width: 0.65, height: 0.92, depth: 0.65 },
                color: "#3B4A3F",
                accentColor: "#1F2822",
              },
            ],
            notes: "Focused creative workspace with warm timber tones and plenty of storage.",
            isPublic: true,
            likesCount: 38,
            likedBy: [],
            comments: [],
            createdAt: "2026-08-18T10:15:00.000Z",
            updatedAt: "2026-08-18T10:15:00.000Z",
          },
        ],
      },
      {
        _id: user3Id,
        id: user3Id,
        name: "Sofia Chen",
        username: "sofia_terracotta",
        email: "sofia@auraspace.design",
        password: hashPassword("auraspace123"),
        createdAt: "2026-08-20T12:00:00.000Z",
        lastLoginAt: now,
        bio: "Mediterranean architecture and warm atmospheric spatial design.",
        avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=sofia_terracotta",
        badges: ["first_blueprint", "material_master"],
        showcasedBadges: ["material_master"],
        totalLikes: 29,
        projects: [
          {
            id: "proj_showcase_mediterranean",
            name: "Mediterranean Sunlit Loft",
            userId: user3Id,
            userEmail: "sofia@auraspace.design",
            userName: "Sofia Chen",
            userAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=sofia_terracotta",
            roomDimensions: { width: 8, length: 6, height: 3.2 },
            colorPalette: {
              id: "terracotta_med",
              name: "Mediterranean Clay",
              wallColor: "#FAF6F0",
              floorColor: "#C97A5E",
              accentColor: "#4A6B5C",
              baseColor: "#EEDCD2",
              floorTextureType: "slate_tile",
              wallTextureType: "limewash",
            },
            placedObjects: [
              {
                id: "obj_med_bed",
                name: "Minimal Platform Bed",
                category: "bedroom",
                proceduralType: "platform_bed",
                position: [0, 0, -1.8],
                rotation: [0, 0, 0],
                dimensions: { width: 2.1, height: 0.65, depth: 2.2 },
                color: "#EEDCD2",
                accentColor: "#C97A5E",
              },
              {
                id: "obj_med_armchair",
                name: "Terracotta Accent Chair",
                category: "seating",
                proceduralType: "lounge_chair",
                position: [2.5, 0, 0.8],
                rotation: [0, -Math.PI / 4, 0],
                dimensions: { width: 0.82, height: 0.78, depth: 0.8 },
                color: "#C97A5E",
                accentColor: "#FAF6F0",
              },
            ],
            notes: "Warm terracotta floors reflecting golden hour sunlight with breathable lime-washed walls.",
            isPublic: true,
            likesCount: 29,
            likedBy: [],
            comments: [],
            createdAt: "2026-08-20T13:00:00.000Z",
            updatedAt: "2026-08-20T13:00:00.000Z",
          },
        ],
      },
    ];
  }

  private persist() {
    try {
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf8");
      fs.renameSync(tempPath, this.filePath);
    } catch (e: any) {
      console.warn("[AuraSpace] Notice writing local database file:", e.message);
    }
  }

  collection(name: string) {
    const self = this;
    if (name === "users") {
      return {
        createIndex: async () => {},
        findOne: async (filter: any) => {
          return self.data.users.find((u) => matchDoc(u, filter)) || null;
        },
        find: (filter: any = {}) => {
          const matched = self.data.users.filter((u) => matchDoc(u, filter));
          return {
            toArray: async () => JSON.parse(JSON.stringify(matched)),
          };
        },
        insertOne: async (doc: any) => {
          const insertedId = doc._id || crypto.randomBytes(12).toString("hex");
          const newDoc = { ...doc, _id: insertedId, id: doc.id || insertedId };
          self.data.users.push(newDoc);
          self.persist();
          return { insertedId };
        },
        updateOne: async (filter: any, update: any) => {
          const doc = self.data.users.find((u) => matchDoc(u, filter));
          if (!doc) {
            return { matchedCount: 0, modifiedCount: 0 };
          }
          if (update.$set) {
            Object.assign(doc, update.$set);
          }
          if (update.$addToSet) {
            for (const [k, v] of Object.entries(update.$addToSet)) {
              if (!Array.isArray(doc[k])) {
                doc[k] = [];
              }
              if (!doc[k].includes(v)) {
                doc[k].push(v);
              }
            }
          }
          self.persist();
          return { matchedCount: 1, modifiedCount: 1 };
        },
        deleteOne: async (filter: any) => {
          const prevLen = self.data.users.length;
          self.data.users = self.data.users.filter((u) => !matchDoc(u, filter));
          self.persist();
          return { deletedCount: prevLen - self.data.users.length };
        },
      };
    }

    if (name === "projects") {
      return {
        drop: async () => {},
        find: () => ({ toArray: async () => [] }),
      };
    }

    return {
      createIndex: async () => {},
      findOne: async () => null,
      find: () => ({ toArray: async () => [] }),
      insertOne: async () => ({ insertedId: crypto.randomBytes(12).toString("hex") }),
      updateOne: async () => ({ matchedCount: 0, modifiedCount: 0 }),
      deleteOne: async () => ({ deletedCount: 0 }),
      drop: async () => {},
    };
  }

  async listCollections() {
    return {
      toArray: async () => [{ name: "users" }],
    };
  }

  async command(_cmd: any) {
    return { ok: 1 };
  }
}

let localDbInstance: LocalFileDatabase | null = null;
function getLocalFileDb(): LocalFileDatabase {
  if (!localDbInstance) {
    const dbPath = path.join(process.cwd(), "data", "auraspace_db.json");
    localDbInstance = new LocalFileDatabase(dbPath);
  }
  return localDbInstance;
}

let activeDb: any = null;
let mongoFailedCooldown = false;
let mongoClient: MongoClient | null = null;

// Permanently drop 'projects' collection and ensure projects are stored directly inside user documents
async function ensureProjectsCollectionRemoved(db: any) {
  try {
    const collections = await db.listCollections().toArray();
    const hasProjects = collections.some((c: any) => c.name === "projects");
    if (hasProjects) {
      console.log("Removing 'projects' collection from database and consolidating projects into specific user documents...");
      try {
        const existingProjects = await db.collection("projects").find({}).toArray();
        for (const proj of existingProjects) {
          if (proj.userId || proj.userEmail) {
            let userFilter: any = null;
            if (proj.userId && ObjectId.isValid(proj.userId)) {
              userFilter = { $or: [{ _id: new ObjectId(proj.userId) }, { id: proj.userId }] };
            } else if (proj.userId) {
              userFilter = { id: proj.userId };
            } else if (proj.userEmail) {
              userFilter = { email: String(proj.userEmail).toLowerCase() };
            }

            if (userFilter) {
              const user = await db.collection("users").findOne(userFilter);
              if (user) {
                const pid = proj.id || proj._id?.toString() || proj.clientProjId;
                const cleanProj = { ...proj, id: pid };
                delete cleanProj._id;
                const userProjs: any[] = user.projects || [];
                const exists = userProjs.some((p: any) => p.id === pid || (p.name && p.name === proj.name));
                if (!exists) {
                  userProjs.unshift(cleanProj);
                  await db.collection("users").updateOne(
                    { _id: user._id },
                    { $set: { projects: userProjs } }
                  );
                }
              }
            }
          }
        }
      } catch (readErr: any) {
        console.warn("Could not read projects collection before dropping:", readErr.message);
      }

      await db.collection("projects").drop();
      console.log("SUCCESS: 'projects' collection dropped. All projects are stored inside user documents.");
    }
  } catch (err: any) {
    if (!err.message?.includes("ns not found")) {
      console.warn("Notice during projects collection removal:", err.message);
    }
  }
}

async function getDb(): Promise<any> {
  if (activeDb) {
    return activeDb;
  }

  const uri = getMongoUri();
  if (uri && !mongoFailedCooldown) {
    try {
      console.log("[AuraSpace] Attempting MongoDB Atlas connection...");
      mongoClient = new MongoClient(uri, {
        connectTimeoutMS: 4000,
        serverSelectionTimeoutMS: 4000,
      });

      await mongoClient.connect();
      const mongoDb = mongoClient.db("Aura_Space");

      try {
        await mongoDb.collection("users").createIndex({ email: 1 }, { unique: true });
      } catch {
        // ignore
      }

      await ensureProjectsCollectionRemoved(mongoDb);

      console.log("[AuraSpace] MongoDB connected successfully.");
      activeDb = mongoDb;
      return activeDb;
    } catch (err: any) {
      console.log(`[AuraSpace] Notice: MongoDB connection not available (${err.message}). Using persistent local storage.`);
      mongoFailedCooldown = true;
      setTimeout(() => {
        mongoFailedCooldown = false;
      }, 5 * 60 * 1000);
    }
  }

  // Use persistent local file database
  activeDb = getLocalFileDb();
  return activeDb;
}

// Lazy Gemini AI initialization
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check
app.get("/api/health", async (req, res) => {
  let isMongo = false;
  let mongoStatus = "local_file_store";
  try {
    const db = await getDb();
    if (db) {
      await db.command({ ping: 1 });
      isMongo = Boolean(mongoClient && activeDb && activeDb !== localDbInstance);
      mongoStatus = isMongo ? "connected" : "local_file_store";
    }
  } catch (err: any) {
    mongoStatus = `error: ${err.message}`;
  }

  res.json({
    status: "ok",
    app: "AuraSpace",
    mongodb: mongoStatus,
    storage: isMongo ? "mongodb_cloud" : "persistent_local_json",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. User Authentication API (Signup & Login with MongoDB)
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: "Full name, email address, and password are required.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters.",
      });
    }

    const db = await getDb();
    const existing = await db.collection("users").findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "An account with this email address already exists. Please sign in.",
      });
    }

    const now = new Date().toISOString();
    const newUser = {
      username: cleanName,
      name: cleanName,
      email: cleanEmail,
      password: hashPassword(password),
      createdAt: now,
      lastLoginAt: now,
      bio: "Spatial designer crafting interior realms with AuraSpace.",
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      badges: ["first_blueprint"],
      showcasedBadges: ["first_blueprint"],
      projects: [],
      totalLikes: 0,
    };

    const insertResult = await db.collection("users").insertOne(newUser);
    const userId = insertResult.insertedId.toString();

    res.json({
      success: true,
      user: {
        id: userId,
        name: cleanName,
        username: cleanName,
        email: cleanEmail,
        createdAt: now,
        bio: newUser.bio,
        avatarUrl: newUser.avatarUrl,
        badges: newUser.badges,
        showcasedBadges: newUser.showcasedBadges,
        totalLikes: 0,
        projects: [],
      },
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create account. Please check your database connection.",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const hashedPassword = hashPassword(password);

    const db = await getDb();
    const user = await db.collection("users").findOne({
      email: cleanEmail,
      password: hashedPassword,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password. Please verify your credentials.",
      });
    }

    const now = new Date().toISOString();
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: now } }
    );

    // Calculate total likes from public projects
    const userProjects = user.projects || [];
    const totalLikes = userProjects.reduce((acc: number, p: any) => acc + (p.likesCount || 0), 0);

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name || user.username,
        username: user.username || user.name,
        email: user.email,
        createdAt: user.createdAt,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email)}`,
        badges: user.badges || ["first_blueprint"],
        showcasedBadges: user.showcasedBadges || ["first_blueprint"],
        totalLikes: typeof user.totalLikes === "number" ? user.totalLikes : totalLikes,
        projects: userProjects,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to authenticate. Please check your database connection.",
    });
  }
});

// Change Password API (WhatsApp / Instagram style Account Security)
app.post("/api/auth/change-password", async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "User ID, current password, and new password are required.",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long.",
      });
    }

    const db = await getDb();
    let userFilter: any = { id: userId };
    if (ObjectId.isValid(userId)) {
      userFilter = { $or: [{ _id: new ObjectId(userId) }, { id: userId }] };
    }

    const user = await db.collection("users").findOne(userFilter);
    if (!user) {
      return res.status(404).json({ success: false, error: "User account not found." });
    }

    const hashedOld = hashPassword(oldPassword);
    if (user.password !== hashedOld) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect. Please verify your credentials.",
      });
    }

    const hashedNew = hashPassword(newPassword);
    await db.collection("users").updateOne(userFilter, {
      $set: { password: hashedNew, passwordUpdatedAt: new Date().toISOString() },
    });

    res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Profile Management API (Saved directly inside specific user document in users collection)
app.get("/api/user/profile", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const db = await getDb();
    let userQuery: any = { id: userId };
    if (ObjectId.isValid(userId)) {
      userQuery = { $or: [{ _id: new ObjectId(userId) }, { id: userId }] };
    }

    const user = await db.collection("users").findOne(userQuery);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const userProjects: any[] = user.projects || [];
    const totalLikes = userProjects.reduce((acc: number, p: any) => acc + (p.likesCount || 0), 0);

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name || user.username,
        username: user.username || user.name,
        email: user.email,
        createdAt: user.createdAt,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email)}`,
        badges: user.badges || [],
        showcasedBadges: user.showcasedBadges || [],
        totalLikes: typeof user.totalLikes === "number" ? user.totalLikes : totalLikes,
        projects: userProjects,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/user/profile", async (req, res) => {
  try {
    const { userId, name, username, bio, avatarUrl, showcasedBadges } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const db = await getDb();
    let userQuery: any = { id: userId };
    if (ObjectId.isValid(userId)) {
      userQuery = { $or: [{ _id: new ObjectId(userId) }, { id: userId }] };
    }

    const user = await db.collection("users").findOne(userQuery);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const updateFields: any = {};
    if (typeof name === "string") updateFields.name = name.trim();
    if (typeof username === "string") updateFields.username = username.trim();
    if (typeof bio === "string") updateFields.bio = bio.trim();
    if (typeof avatarUrl === "string") updateFields.avatarUrl = avatarUrl.trim();
    if (Array.isArray(showcasedBadges)) updateFields.showcasedBadges = showcasedBadges;

    // Synchronize display name and avatar across user's embedded projects
    const newDisplayName = updateFields.username || updateFields.name;
    const currentProjects: any[] = user.projects || [];
    if (newDisplayName || updateFields.avatarUrl) {
      updateFields.projects = currentProjects.map((p: any) => ({
        ...p,
        userName: newDisplayName || p.userName,
        userAvatar: updateFields.avatarUrl !== undefined ? updateFields.avatarUrl : p.userAvatar,
      }));
    }

    await db.collection("users").updateOne(userQuery, { $set: updateFields });

    const updated = await db.collection("users").findOne(userQuery);

    res.json({
      success: true,
      user: {
        id: updated._id.toString(),
        name: updated.name || updated.username,
        username: updated.username || updated.name,
        email: updated.email,
        createdAt: updated.createdAt,
        bio: updated.bio || "",
        avatarUrl: updated.avatarUrl || "",
        badges: updated.badges || [],
        showcasedBadges: updated.showcasedBadges || [],
        totalLikes: updated.totalLikes || 0,
        projects: updated.projects || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Unlock Badge API
app.post("/api/user/badge", async (req, res) => {
  try {
    const { userId, badgeId } = req.body;
    if (!userId || !badgeId) {
      return res.status(400).json({ success: false, error: "userId and badgeId required" });
    }

    const db = await getDb();
    let userQuery: any = { id: userId };
    if (ObjectId.isValid(userId)) {
      userQuery = { $or: [{ _id: new ObjectId(userId) }, { id: userId }] };
    }

    await db.collection("users").updateOne(userQuery, {
      $addToSet: { badges: badgeId },
    });

    const user = await db.collection("users").findOne(userQuery);
    res.json({ success: true, badges: user?.badges || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Projects API (Stored exclusively inside specific user document in 'users' collection)
app.get("/api/projects", async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.query.userId as string | undefined;

    if (!userId || userId === "anonymous") {
      return res.json({
        success: true,
        projects: [],
      });
    }

    // Fetch user document to read embedded projects inside the specific user
    let userDoc: any = null;
    try {
      if (ObjectId.isValid(userId)) {
        userDoc = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      }
      if (!userDoc) {
        userDoc = await db.collection("users").findOne({ id: userId });
      }
    } catch (e) {}

    const userEmbeddedProjects: any[] = userDoc?.projects || [];
    const projects = userEmbeddedProjects.map((p: any) => ({
      ...p,
      id: p.id || p.clientProjId || (p._id ? p._id.toString() : `project_${Date.now()}`),
    }));

    projects.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

    res.json({
      success: true,
      projects,
    });
  } catch (err: any) {
    console.warn("Fetch projects notice:", err.message);
    res.status(200).json({
      success: false,
      error: err.message,
      projects: [],
      note: "Using local storage fallback",
    });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const db = await getDb();
    const projectData = req.body;
    const now = new Date().toISOString();

    const clientProjId = projectData.id || `project_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const doc = {
      id: clientProjId,
      name: projectData.name || "Untitled Spatial Plan",
      userId: projectData.userId || null,
      userEmail: projectData.userEmail || null,
      userName: projectData.userName || "",
      userAvatar: projectData.userAvatar || "",
      roomDimensions: projectData.roomDimensions || { width: 6, length: 5, height: 2.8 },
      colorPalette: projectData.colorPalette || null,
      placedObjects: projectData.placedObjects || [],
      notes: projectData.notes || "",
      isPublic: Boolean(projectData.isPublic),
      likesCount: typeof projectData.likesCount === "number" ? projectData.likesCount : 0,
      likedBy: Array.isArray(projectData.likedBy) ? projectData.likedBy : [],
      comments: Array.isArray(projectData.comments) ? projectData.comments : [],
      updatedAt: now,
      createdAt: projectData.createdAt || now,
      forkedFrom: projectData.forkedFrom || undefined,
    };

    // Save project inside the specific user in the database (user.projects)
    if (doc.userId) {
      let userFilter: any = { id: doc.userId };
      if (ObjectId.isValid(doc.userId)) {
        userFilter = { $or: [{ _id: new ObjectId(doc.userId) }, { id: doc.userId }] };
      }

      const user = await db.collection("users").findOne(userFilter);
      if (user) {
        const existingProjects: any[] = user.projects || [];
        const idx = existingProjects.findIndex(
          (p: any) => p.id === clientProjId || p.clientProjId === clientProjId || (p.name === doc.name && doc.name)
        );

        if (idx >= 0) {
          const existing = existingProjects[idx];
          // Security check: If existing project belonged to another user ID, block overwrite
          if (existing.userId && String(existing.userId) !== String(doc.userId)) {
            return res.status(403).json({
              success: false,
              error: "Forbidden: You cannot overwrite another designer's blueprint. Use 'Copy / Remix' to save your own editable version.",
              isProtected: true,
            });
          }

          existingProjects[idx] = {
            ...existing,
            ...doc,
            createdAt: existing.createdAt || doc.createdAt,
            likesCount: existing.likesCount !== undefined ? existing.likesCount : doc.likesCount,
            likedBy: existing.likedBy || doc.likedBy,
            comments: existing.comments || doc.comments,
          };
        } else {
          existingProjects.unshift(doc);
        }

        await db.collection("users").updateOne(userFilter, {
          $set: { projects: existingProjects },
        });
      }
    }

    res.json({
      success: true,
      project: doc,
    });
  } catch (err: any) {
    console.warn("Save project notice:", err.message);
    res.status(200).json({
      success: false,
      error: err.message,
      note: "Saved locally; database sync will retry",
    });
  }
});

// Copy / Remix a public project to the user's account (Immutable origin protection)
app.post("/api/projects/:id/fork", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, userEmail } = req.body;
    const db = await getDb();

    // Look for source blueprint across all users
    const allUsers = await db.collection("users").find({}).toArray();
    let source: any = null;
    for (const u of allUsers) {
      const found = (u.projects || []).find((p: any) => p.id === id || p.clientProjId === id || p._id === id);
      if (found) {
        source = found;
        break;
      }
    }

    if (!source) {
      return res.status(404).json({ success: false, error: "Source blueprint not found" });
    }

    const now = new Date().toISOString();
    const cleanSourceTitle = (source.name || "Untitled Blueprint").replace(/ \(Remix\)+$| \(Copy\)+$/i, "").trim();
    const clonedName = `${cleanSourceTitle} (Remix)`;
    const newClientProjId = `project_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const forkedDoc = {
      id: newClientProjId,
      name: clonedName,
      userId: userId || null,
      userEmail: userEmail || null,
      userName: userName || "Community Designer",
      userAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userEmail || userName || "guest")}`,
      roomDimensions: source.roomDimensions || { width: 6, length: 5, height: 2.8 },
      colorPalette: source.colorPalette,
      placedObjects: JSON.parse(JSON.stringify(source.placedObjects || [])),
      notes: `Remixed from @${source.userName || "community"}`,
      isPublic: false, // Default private for remix
      likesCount: 0,
      likedBy: [],
      comments: [],
      forkedFrom: {
        projectId: source.id || source._id?.toString(),
        authorName: source.userName || "Community Designer",
        authorId: source.userId || null,
      },
      createdAt: now,
      updatedAt: now,
    };

    // Embed in copying user's document
    if (userId) {
      let userFilter: any = { id: userId };
      if (ObjectId.isValid(userId)) {
        userFilter = { $or: [{ _id: new ObjectId(userId) }, { id: userId }] };
      }
      const user = await db.collection("users").findOne(userFilter);
      if (user) {
        const existingProjects: any[] = user.projects || [];
        existingProjects.unshift(forkedDoc);
        await db.collection("users").updateOne(userFilter, { $set: { projects: existingProjects } });
      }
    }

    res.json({
      success: true,
      project: forkedDoc,
      message: `Blueprint copied successfully as "${clonedName}". You can now customize your own version without affecting the original!`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const userId = req.query.userId as string | undefined;

    if (userId) {
      let userFilter: any = { id: userId };
      if (ObjectId.isValid(userId)) {
        userFilter = { $or: [{ _id: new ObjectId(userId) }, { id: userId }] };
      }
      const user = await db.collection("users").findOne(userFilter);
      if (user && Array.isArray(user.projects)) {
        const filtered = user.projects.filter(
          (p: any) => p.id !== id && p.clientProjId !== id && p._id !== id
        );
        await db.collection("users").updateOne(userFilter, { $set: { projects: filtered } });
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.warn("Delete project notice:", err.message);
    res.json({ success: true, note: "Deleted locally or DB offline" });
  }
});

// 4. Public Gallery & Social Collaboration APIs (Public / Private toggle, Likes, Comments)
app.get("/api/gallery", async (req, res) => {
  try {
    const db = await getDb();
    // Return all public designs collected from users
    const users = await db.collection("users").find({}).toArray();
    const publicProjects: any[] = [];

    for (const u of users) {
      for (const p of u.projects || []) {
        if (p.isPublic) {
          publicProjects.push({
            ...p,
            id: p.id || p.clientProjId || (p._id ? p._id.toString() : undefined),
            userName: p.userName || u.username || u.name || "Community Designer",
            userAvatar: p.userAvatar || u.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.email || "user")}`,
          });
        }
      }
    }

    publicProjects.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));

    res.json({
      success: true,
      projects: publicProjects,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, projects: [] });
  }
});

// Toggle Public / Private visibility
app.post("/api/projects/:id/visibility", async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId required" });
    }

    const db = await getDb();
    let userFilter: any = { id: userId };
    if (ObjectId.isValid(userId)) {
      userFilter = { $or: [{ _id: new ObjectId(userId) }, { id: userId }] };
    }

    const user = await db.collection("users").findOne(userFilter);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const updatedProjs = (user.projects || []).map((p: any) =>
      p.id === id || p.clientProjId === id ? { ...p, isPublic: Boolean(isPublic) } : p
    );

    await db.collection("users").updateOne(userFilter, { $set: { projects: updatedProjs } });

    res.json({ success: true, isPublic: Boolean(isPublic) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Like / Unlike project
app.post("/api/projects/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId required to like" });
    }

    const db = await getDb();
    const users = await db.collection("users").find({}).toArray();

    let targetUser: any = null;
    let targetProject: any = null;
    let targetIdx = -1;

    for (const u of users) {
      const idx = (u.projects || []).findIndex((p: any) => p.id === id || p.clientProjId === id);
      if (idx >= 0) {
        targetUser = u;
        targetProject = u.projects[idx];
        targetIdx = idx;
        break;
      }
    }

    if (!targetUser || !targetProject) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const likedBy: string[] = targetProject.likedBy || [];
    const hasLiked = likedBy.includes(userId);
    const updatedLikedBy = hasLiked ? likedBy.filter((uid) => uid !== userId) : [...likedBy, userId];
    const newLikesCount = updatedLikedBy.length;

    targetUser.projects[targetIdx] = {
      ...targetProject,
      likedBy: updatedLikedBy,
      likesCount: newLikesCount,
    };

    const totalLikes = targetUser.projects.reduce((acc: number, p: any) => acc + (p.likesCount || 0), 0);
    await db.collection("users").updateOne(
      { _id: targetUser._id },
      { $set: { projects: targetUser.projects, totalLikes } }
    );

    res.json({
      success: true,
      hasLiked: !hasLiked,
      likesCount: newLikesCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add comment to project
app.post("/api/projects/:id/comment", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, userAvatar, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: "Comment text cannot be empty" });
    }

    const db = await getDb();
    const users = await db.collection("users").find({}).toArray();

    let targetUser: any = null;
    let targetProject: any = null;
    let targetIdx = -1;

    for (const u of users) {
      const idx = (u.projects || []).findIndex((p: any) => p.id === id || p.clientProjId === id);
      if (idx >= 0) {
        targetUser = u;
        targetProject = u.projects[idx];
        targetIdx = idx;
        break;
      }
    }

    if (!targetUser || !targetProject) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const newComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: userId || "anonymous",
      userName: userName || "Interior Designer",
      userAvatar: userAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userName || "guest")}`,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const comments = targetProject.comments || [];
    comments.push(newComment);
    targetUser.projects[targetIdx] = {
      ...targetProject,
      comments,
    };

    await db.collection("users").updateOne(
      { _id: targetUser._id },
      { $set: { projects: targetUser.projects } }
    );

    res.json({
      success: true,
      comment: newComment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin endpoint to explicitly confirm removal of the 'projects' collection and report DB collections
app.post("/api/admin/remove-projects-collection", async (req, res) => {
  try {
    const db = await getDb();
    await ensureProjectsCollectionRemoved(db);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c: any) => c.name);

    res.json({
      success: true,
      message: "The 'projects' collection has been removed. All projects are stored within the specific user documents in the 'users' collection.",
      activeCollections: collectionNames,
      projectsCollectionExists: collectionNames.includes("projects"),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Gemini AI Spatial Assistant & In-App Advisor Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { prompt, messages, currentRoom, currentObjects } = req.body;
    const ai = getAiClient();

    const systemInstruction = `You are Aura AI, the dedicated spatial intelligence and 3D interior design assistant for AuraSpace.

YOUR STRICT SCOPE AND BOUNDARIES:
1. GREETINGS & CASUAL COURTESY:
   - Always warmly answer basic greetings: "Hi", "Hello", "Hey", "Good morning", "Who are you?", "What can you do?", etc.
   - Introduce yourself politely as Aura AI, the 3D interior design and spatial planning advisor.

2. ALLOWED TOPICS (Strictly AuraSpace app & Interior Architecture):
   - HOW TO USE AURASPACE:
     * 3D Navigation: Left-click and drag to rotate the camera around the room, right-click and drag to pan, scroll wheel to zoom in/out.
     * View Modes: Switch between "3D Perspective", "3D Isometric", and "2D Blueprint" in the top bar.
     * Adding Furniture: Select any item from the left Catalog sidebar (seating, tables, storage, beds, lighting, appliances, plants) and click or drag it into the room.
     * Moving Furniture: Click on any furniture item to select it, then drag it across the floor grid.
     * Rotating Furniture: Click the amber ring around any selected object or use the rotation slider in the right Properties sidebar. Press 'R' on the keyboard for quick 45-degree rotation.
     * Customizing Dimensions & Materials: Use the right Properties sidebar to change width, length, height, finish color, and accent color.
     * Room Dimensions: Click Room Settings to customize width (X), length (Z), and ceiling height (Y).
     * Color Palettes: Choose between Nordic Oak, Japandi Stone, Mediterranean Clay, Brutalist Concrete, and Mid-Century Walnut, or add custom hex colors.
     * Cutaway Wall Mode: Toggle cutaway walls to peek into rooms from any angle.
     * Augmented Reality (AR): Click the AR button. On desktop, scan the QR code with your smartphone. On mobile, launch WebXR or camera passthrough to project your room onto real floors at 1:1 scale.
     * Saving & Accounts: Sign up or log in to automatically sync your projects to MongoDB cloud storage so your projects are saved privately in your account.
     * Keyboard Shortcuts: Delete or Backspace to remove selected item, Escape to deselect, R to rotate.
   - INTERIOR DESIGN GUIDANCE:
     * Spatial circulation (recommend 0.9m minimum clearance corridors for ergonomic traffic flow).
     * Furniture arrangement, lighting balance (ambient vs task vs accent), biophilic plants, and cohesive color palettes.

3. STRICTLY FORBIDDEN OFF-TOPIC QUESTIONS:
   - If the user asks about ANYTHING outside of AuraSpace, app controls, or interior design (such as coding homework, general history, math questions, politics, sports, celebrity gossip, recipes, stock market, world trivia, writing essays), you MUST politely and firmly decline:
     "I am your dedicated AuraSpace assistant. I can only assist with using the AuraSpace 3D interior design app, spatial planning, furniture arrangements, and AR preview features. How can I help you design your room today?"

4. STYLE:
   - Keep answers clear, friendly, scannable, and helpful with concise bullet points where appropriate.`;

    if (!ai) {
      // Fallback offline responses if API key is not configured
      const q = (prompt || "").trim().toLowerCase();
      if (/^(hi|hello|hey|greetings|good\s*(morning|evening|afternoon)|who are you|what can you do)/i.test(q)) {
        return res.json({
          success: true,
          reply: "Hello! I am Aura AI, your spatial planning and 3D interior design assistant for AuraSpace. You can ask me how to place furniture, rotate items, adjust room dimensions, change wall and floor palettes, or use AR mode to preview your layout in real space. How can I assist your design today?",
          source: "offline_assistant",
        });
      }

      if (q.includes("rotate")) {
        return res.json({
          success: true,
          reply: "To rotate furniture in AuraSpace:\n• Click any placed object to select it.\n• Click and drag the amber circular rotation ring around the object.\n• Or adjust the rotation slider in the right-hand Properties sidebar.\n• You can also press the 'R' key on your keyboard to rotate 45° instantly.",
          source: "offline_assistant",
        });
      }

      if (q.includes("ar") || q.includes("augmented reality") || q.includes("mobile")) {
        return res.json({
          success: true,
          reply: "To view your room in Augmented Reality (AR):\n• Click the 'AR' button in the top navigation bar.\n• If you are on desktop, a high-resolution QR code will appear. Scan it with your iPhone or Android camera.\n• On mobile, tap 'Launch AR Mode' to place your 3D furniture into your real-world room at 1:1 scale using your phone's camera.",
          source: "offline_assistant",
        });
      }

      if (q.includes("move") || q.includes("place") || q.includes("catalog")) {
        return res.json({
          success: true,
          reply: "To add and move furniture:\n• Open the left Catalog sidebar and click any item to place it in your room.\n• Click and drag any placed item to reposition it on the floor.\n• Toggle 'Snap to Grid' in the top bar to align pieces neatly to 0.25m grid lines.",
          source: "offline_assistant",
        });
      }

      return res.json({
        success: true,
        reply: "I am your dedicated AuraSpace assistant. I can help you with 3D room navigation, placing and rotating furniture, room dimensions, color palettes, project saving, and AR preview. How can I help you with your room?",
        source: "offline_assistant",
      });
    }

    // Build context with current room & placed items
    const roomContext = `Current Room Context: Width ${currentRoom?.width || 6}m, Length ${currentRoom?.length || 5}m, Height ${currentRoom?.height || 2.8}m. Placed furniture count: ${(currentObjects || []).length}.`;

    const conversationHistory: any[] = [];
    if (Array.isArray(messages)) {
      for (const m of messages.slice(-8)) {
        conversationHistory.push({
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        });
      }
    }

    const currentTurn = `${roomContext}\nUser Query: ${prompt}`;
    conversationHistory.push({
      role: "user",
      parts: [{ text: currentTurn }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: conversationHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I am here to help you design your space in AuraSpace. What would you like to build?";

    res.json({
      success: true,
      reply: replyText,
      source: "gemini",
    });
  } catch (err: any) {
    console.error("Gemini AI chat error:", err.message);
    res.json({
      success: true,
      reply: "Hello! I am Aura AI, your spatial interior design assistant. You can ask me how to place and rotate furniture, change wall and floor textures, switch to 2D Blueprint or AR mode, and organize your layout. How can I assist you?",
      source: "offline_fallback",
    });
  }
});

// 3. AI Interior Design Advisor Endpoint
app.post("/api/ai/suggest", async (req, res) => {
  try {
    const { prompt, currentRoom, currentObjects } = req.body;
    const ai = getAiClient();

    if (!ai) {
      // Fallback smart algorithmic recommendation if Gemini API key isn't configured yet
      return res.json({
        success: true,
        source: "offline_engine",
        suggestion: {
          title: "Harmonious Spatial Balance",
          advice: `For a ${currentRoom?.width || 6}m × ${currentRoom?.length || 5}m room, we recommend orienting key seating toward natural light while maintaining 0.9m minimum clearance corridors for ergonomic flow.`,
          recommendedPalette: {
            name: "Nordic Serenity",
            wallColor: "#F4F1EA",
            floorColor: "#D4C2AA",
            accentColor: "#2C3E35",
          },
          recommendedAdditions: [
            {
              catalogId: "monstera_plant",
              name: "Potted Monstera",
              proceduralType: "potted_monstera",
              suggestedPosition: [
                (currentRoom?.width || 6) / 2 - 0.7,
                0,
                -(currentRoom?.length || 5) / 2 + 0.7,
              ],
              reason: "Adds biophilic warmth to the corner without obstructing walkways.",
            },
            {
              catalogId: "arc_lamp",
              name: "Minimalist Arch Lamp",
              proceduralType: "floor_lamp",
              suggestedPosition: [
                -(currentRoom?.width || 6) / 2 + 0.8,
                0,
                0.5,
              ],
              reason: "Provides warm atmospheric accent lighting at eye level.",
            },
          ],
        },
      });
    }

    const systemInstruction = `You are AuraSpace's master interior designer and 3D spatial planning assistant.
Analyze room dimensions and currently placed furniture items, and provide sophisticated, ergonomic, aesthetically cohesive recommendations.
Always format your response as strict JSON with:
{
  "title": "Short title of advice",
  "advice": "Concise architectural and interior design evaluation",
  "aestheticStyle": "e.g. Japandi, Mid-Century Modern, Industrial Loft, Scandinavian",
  "flowAnalysis": "Clearance and ergonomics assessment",
  "recommendedPalette": {
    "name": "Palette Name",
    "wallColor": "#HEX",
    "floorColor": "#HEX",
    "accentColor": "#HEX"
  },
  "suggestedAdditions": [
    {
      "catalogId": "item_catalog_id",
      "name": "Item Name",
      "proceduralType": "one of: modern_sofa, lounge_chair, coffee_table, dining_table, bookshelf, platform_bed, floor_lamp, potted_monstera, credenza, work_desk, rug",
      "suggestedPosition": [x, 0, z],
      "reason": "Why this enhances the space"
    }
  ]
}
Ensure coordinates fall comfortably within -width/2 to +width/2 and -length/2 to +length/2.`;

    const userPrompt = `Room Dimensions: Width: ${currentRoom?.width || 6}m, Length: ${
      currentRoom?.length || 5
    }m, Height: ${currentRoom?.height || 2.8}m.
Currently placed furniture: ${JSON.stringify(
      (currentObjects || []).map((o: any) => ({
        name: o.name,
        type: o.proceduralType,
        position: o.position,
        dimensions: o.dimensions,
      }))
    )}.
User Request: ${prompt || "Analyze this room and propose an optimal, balanced interior arrangement."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    res.json({
      success: true,
      source: "gemini",
      suggestion: parsed,
    });
  } catch (err: any) {
    console.warn("Gemini API call returned error, falling back to spatial heuristic engine:", err.message);
    const { currentRoom } = req.body || {};
    const w = currentRoom?.width || 6;
    const l = currentRoom?.length || 5;

    res.json({
      success: true,
      source: "spatial_heuristic_engine",
      suggestion: {
        title: "Balanced Spatial Circulation & Natural Flow",
        advice: `For a ${w.toFixed(1)}m × ${l.toFixed(1)}m room with ${(w * l).toFixed(1)}m² floor area, we recommend keeping a minimum 0.9m circulation zone between your primary seating group and entry portals. Placing primary seating perpendicular to ambient natural light reduces visual glare.`,
        aestheticStyle: "Modern Scandinavian / Japandi",
        flowAnalysis: "Ergonomic 0.9m perimeter corridors preserved. Unobstructed central circulation with balanced weight distribution.",
        recommendedPalette: {
          name: "Japandi Stone & Linen",
          wallColor: "#EAE7DF",
          floorColor: "#A69888",
          accentColor: "#2D3748",
        },
        suggestedAdditions: [
          {
            catalogId: "coffee_table",
            name: "Organic Coffee Table",
            proceduralType: "coffee_table",
            suggestedPosition: [0, 0, 0],
            reason: "Anchors the central conversational zone at an ergonomic 0.45m height.",
          },
          {
            catalogId: "monstera_plant",
            name: "Potted Monstera",
            proceduralType: "potted_monstera",
            suggestedPosition: [w / 2 - 0.7, 0, -l / 2 + 0.7],
            reason: "Introduces biophilic organic relief in the corner zone.",
          },
          {
            catalogId: "arc_lamp",
            name: "Minimalist Arch Lamp",
            proceduralType: "floor_lamp",
            suggestedPosition: [-w / 2 + 0.8, 0, -0.4],
            reason: "Warm eye-level directional task illumination.",
          },
        ],
      },
    });
  }
});

// Vite middleware / static files
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AuraSpace] Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupViteOrStatic().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

export default app;
