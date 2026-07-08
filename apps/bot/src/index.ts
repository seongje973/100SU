import { BaeksuBotClient } from "./lib/BaeksuBotClient";
import { registerLavalinkEvents } from "./lib/audio/LavalinkEventHandlers";

const client = new BaeksuBotClient();

// Register Lavalink events
registerLavalinkEvents(client);

// Note: Discord gateway raw events are now forwarded by the raw.ts listener.

client.logger.info("Logging in to Discord...");
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    client.logger.info("Login promise resolved!");
  })
  .catch((err) => {
    client.logger.error("Failed to login to Discord:", err);
  });

