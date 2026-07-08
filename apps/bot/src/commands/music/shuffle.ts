import { Command } from "@sapphire/framework";
import { ApplicationCommandRegistry } from "@sapphire/framework";
import { GuildMember } from "discord.js";
import { BaeksuBotClient } from "../../lib/BaeksuBotClient";

export class ShuffleCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "대기열의 노래를 무작위로 섞습니다.",
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("shuffle").setDescription("대기열에 등록된 음원 목록을 무작위 순서로 변경합니다.")
    );
    registry.registerChatInputCommand((builder) =>
      builder.setName("셔플").setDescription("대기열에 등록된 음원 목록을 무작위 순서로 변경합니다.")
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

    if (player.queue.tracks.length < 2) {
      return interaction.reply({
        content: "❌ 대기열에 최소 2곡 이상 음악이 등록되어 있어야 섞을 수 있습니다.",
        ephemeral: true,
      });
    }

    try {
      await player.queue.shuffle();
      return interaction.reply("🔀 대기열 목록의 순서를 무작위로 섞었습니다.");
    } catch (err) {
      client.logger.error("Error running shuffle command:", err);
      return interaction.reply({
        content: "❌ 대기열을 섞는 중 에러가 발생했습니다.",
        ephemeral: true,
      });
    }
  }
}
