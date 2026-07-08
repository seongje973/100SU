import { Command } from "@sapphire/framework";
import { ApplicationCommandRegistry } from "@sapphire/framework";
import { GuildMember } from "discord.js";
import { BaeksuBotClient } from "../../lib/BaeksuBotClient";

export class SkipCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "현재 재생 중인 노래를 건너뜁니다.",
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("skip").setDescription("현재 곡을 건너뛰고 다음 곡을 재생합니다.")
    );
    registry.registerChatInputCommand((builder) =>
      builder.setName("스킵").setDescription("현재 곡을 건너뛰고 다음 곡을 재생합니다.")
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const client = this.container.client as BaeksuBotClient;
    const { guild, member } = interaction;

    if (!guild || !member) return;

    const voiceChannel = (member as GuildMember).voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ 먼저 음성 채널에 입장해 주세요.",
        ephemeral: true,
      });
    }

    const player = client.lavalink.getPlayer(guild.id);
    if (!player || !player.connected) {
      return interaction.reply({
        content: "❌ 현재 활성화된 오디오 플레이어가 없습니다.",
        ephemeral: true,
      });
    }

    const botMember = guild.members.me;
    if (botMember?.voice.channel && botMember.voice.channel.id !== voiceChannel.id) {
      return interaction.reply({
        content: "❌ 봇과 같은 음성 채널에 있어야 합니다.",
        ephemeral: true,
      });
    }

    const currentTrack = player.queue.current;
    if (!currentTrack) {
      return interaction.reply({
        content: "❌ 현재 재생 중인 음악이 없어 건너뛸 수 없습니다.",
        ephemeral: true,
      });
    }

    try {
      await player.skip();
      return interaction.reply(`⏭️ **${currentTrack.info.title}** 곡을 스킵했습니다.`);
    } catch (err) {
      client.logger.error("Error running skip command:", err);
      return interaction.reply({
        content: "❌ 음악 건너뛰기 처리 중 에러가 발생했습니다.",
        ephemeral: true,
      });
    }
  }
}
