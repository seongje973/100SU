import { Listener } from "@sapphire/framework";
import { BaeksuBotClient } from "../lib/BaeksuBotClient";

export class RawListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: "raw",
    });
  }

  public run(data: any) {
    const client = this.container.client as BaeksuBotClient;
    if (client.lavalink) {
      client.lavalink.sendRawData(data);
    }
  }
}

