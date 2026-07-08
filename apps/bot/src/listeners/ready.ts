import { Listener } from "@sapphire/framework";
import { BaeksuBotClient } from "../lib/BaeksuBotClient";

export class ReadyListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: "ready",
    });
  }

  public async run() {
    const client = this.container.client as BaeksuBotClient;
    client.logger.info(`Logged in as ${client.user?.tag}!`);

    // Initialize Lavalink Manager
    try {
      await client.lavalink.init({
        id: client.user?.id || "",
        username: client.user?.username || "100SUBOT",
      });
      client.logger.info("[Lavalink] Manager initialized successfully.");
    } catch (err) {
      client.logger.error("[Lavalink] Failed to initialize manager:", err);
    }
  }
}

