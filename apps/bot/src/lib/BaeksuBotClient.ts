import { SapphireClient, LogLevel } from "@sapphire/framework";
import { LavalinkManager } from "lavalink-client";
import { GatewayIntentBits } from "discord.js";
import { prisma } from "@100su/prisma";
import * as dotenv from "dotenv";
import * as path from "path";

// Load root .env file
dotenv.config({ path: path.join(__dirname, "../../../../.env") });

export class BaeksuBotClient extends SapphireClient {
  public readonly lavalink: LavalinkManager;
  public readonly db = prisma;

  public constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      defaultPrefix: "!",
      loadMessageCommandListeners: true,
      enableLoaderTraceLoggings: true,
      baseUserDirectory: path.join(__dirname, ".."),
      logger: {
        level: LogLevel.Debug,
      },
    });

    const lavalinkHost = process.env.LAVALINK_URL ? process.env.LAVALINK_URL.split(":")[0] : "localhost";
    const lavalinkPort = process.env.LAVALINK_URL ? parseInt(process.env.LAVALINK_URL.split(":")[1] || "5000") : 5000;

    this.lavalink = new LavalinkManager({
      nodes: [
        {
          host: lavalinkHost,
          port: lavalinkPort,
          authorization: process.env.LAVALINK_PASSWORD || "youshallnotpass",
          secure: false,
          id: "100su-lavalink-node",
        },
      ],
      sendToShard: (guildId, payload) => {
        const guild = this.guilds.cache.get(guildId);
        if (guild) {
          guild.shard.send(payload);
        }
      },
    });
  }
}

