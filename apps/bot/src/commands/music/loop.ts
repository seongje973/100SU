import { Command } from "@sapphire/framework";
import { ApplicationCommandRegistry } from "@sapphire/framework";
import { GuildMember } from "discord.js";
import { BaeksuBotClient } from "../../lib/BaeksuBotClient";

export class LoopCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "반복 재생 모드를 변경합니다.",
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    // English command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("loop")
        .setDescription("반복 재생 모드를 변경합니다.")
        .addStringOption((option) =>
          option
            .setName("모드")
            .setDescription("반복 모드 선택")
            .setRequired(true)
            .addChoices(
              { name: "끄기 (off)", value: "off" },
              { name: "한 곡 반복 (track)", value: "track" },
              { name: "전체 반복 (queue)", value: "queue" }
            )
        )
    );

    // Korean command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("반복")
        .setDescription("반복 재생 모드를 변경합니다.")
        .addStringOption((option) =>
          option
            .setName("모드")
            .setDescription("반복 모드 선택")
            .setRequired(true)
            .addChoices(
              { name: "끄기 (off)", value: "off" },
              { name: "한 곡 반복 (track)", value: "track" },
              { name: "전체 반복 (queue)", value: "queue" }
            )
        )
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

    const mode = interaction.options.getString("모드", true) as "off" | "track" | "queue";

    try {
      await player.setRepeatMode(mode);
      
      const modeKorean = {
        off: "해제",
        track: "한 곡 반복",
        queue: "대기열 전체 반복",
      };

      return interaction.reply(`🔁 반복 모드를 **${modeKorean[mode]}**으로 설정했습니다.`);
    } catch (err) {
      client.logger.error("Error running loop command:", err);
      return interaction.reply({
        content: "❌ 반복 모드 변경 중 에러가 발생했습니다.",
        ephemeral: true,
      });
    }
  }
}
