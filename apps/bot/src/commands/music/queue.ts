import { Command } from "@sapphire/framework";
import { ApplicationCommandRegistry } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { BaeksuBotClient } from "../../lib/BaeksuBotClient";
import { chunkArray, formatDuration, createProgressBar } from "@100su/utils";

export class QueueCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "대기열의 곡 목록을 확인합니다.",
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    // English command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("queue")
        .setDescription("현재 대기열을 확인합니다.")
        .addIntegerOption((option) =>
          option.setName("페이지").setDescription("조회할 페이지 번호").setRequired(false).setMinValue(1)
        )
    );

    // Korean command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("대기열")
        .setDescription("현재 대기열을 확인합니다.")
        .addIntegerOption((option) =>
          option.setName("페이지").setDescription("조회할 페이지 번호").setRequired(false).setMinValue(1)
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const client = this.container.client as BaeksuBotClient;
    const { guild } = interaction;

    if (!guild) return;

    const player = client.lavalink.getPlayer(guild.id);
    if (!player || !player.connected) {
      return interaction.reply({
        content: "❌ 현재 활성화된 오디오 플레이어가 없습니다.",
        ephemeral: true,
      });
    }

    const currentTrack = player.queue.current;
    const upcomingTracks = player.queue.tracks;

    if (!currentTrack && upcomingTracks.length === 0) {
      return interaction.reply("⏹️ 대기열이 비어있습니다.");
    }

    const page = interaction.options.getInteger("페이지") || 1;
    const pageSize = 10;
    const chunks = chunkArray(upcomingTracks, pageSize);
    const totalPages = chunks.length || 1;

    if (page > totalPages) {
      return interaction.reply({
        content: `❌ 존재하지 않는 페이지입니다. (총 페이지 수: ${totalPages})`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📋 현재 재생 대기열")
      .setTimestamp();

    // Add playing now
    if (currentTrack) {
      const positionMs = player.position ?? 0;
      const durationMs = currentTrack.info.duration ?? 0;
      const progress = durationMs > 0 ? positionMs / durationMs : 0;
      const progressBar = createProgressBar(progress, 15);

      embed.setDescription(
        `**🎶 현재 재생 중:**\n` +
        `[${currentTrack.info.title}](${currentTrack.info.uri || currentTrack.info.identifier})\n` +
        `\`${formatDuration(positionMs)}\` ${progressBar} \`${formatDuration(durationMs)}\`\n` +
        `*신청자: <@${(currentTrack.requester as any).id || currentTrack.requester}>*\n\n` +
        `**🔮 다음 재생 예정 곡 목록:**`
      );
    }

    // Add queue tracks
    if (upcomingTracks.length > 0) {
      const currentPageTracks = chunks[page - 1];
      const startIndex = (page - 1) * pageSize;

      const trackList = currentPageTracks
        .map((track, idx) => {
          const globalIdx = startIndex + idx + 1;
          const duration = formatDuration(track.info.duration ?? 0);
          return `\`${globalIdx}.\` **[${track.info.title}](${track.info.uri || track.info.identifier})** \`[${duration}]\` - *신청자: <@${(track.requester as any).id || track.requester}>*`;
        })
        .join("\n");

      embed.addFields({ name: `페이지 ${page}/${totalPages}`, value: trackList });
    } else {
      embed.addFields({ name: "대기열", value: "다음 재생 예정인 곡이 없습니다. `/재생` 명령어로 노래를 추가해 보세요!" });
    }

    // Embed footer
    const totalDuration = upcomingTracks.reduce((acc, track) => acc + (track.info.duration ?? 0), 0);
    embed.setFooter({
      text: `대기열 곡 수: ${upcomingTracks.length}곡 | 총 대기 재생시간: ${formatDuration(totalDuration)}`,
    });

    return interaction.reply({ embeds: [embed] });
  }
}
