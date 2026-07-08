import { Command } from "@sapphire/framework";
import { ApplicationCommandRegistry } from "@sapphire/framework";
import { GuildMember } from "discord.js";
import { BaeksuBotClient } from "../../lib/BaeksuBotClient";

export class ResumeCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "일시정지된 음악을 다시 재생합니다.",
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("resume").setDescription("일시정지된 음악 재생을 재개합니다.")
    );
    registry.registerChatInputCommand((builder) =>
      builder.setName("다시재생").setDescription("일시정지된 음악 재생을 재개합니다.")
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

    if (!player.paused) {
      return interaction.reply({
        content: "ℹ️ 이미 음악이 재생 중인 상태입니다.",
        ephemeral: true,
      });
    }

    try {
      await player.resume();
      return interaction.reply("▶️ 음악 재생을 다시 시작합니다.");
    } catch (err) {
      client.logger.error("Error running resume command:", err);
      return interaction.reply({
        content: "❌ 음악 재생을 재개하는 중 에러가 발생했습니다.",
        ephemeral: true,
      });
    }
  }
}
