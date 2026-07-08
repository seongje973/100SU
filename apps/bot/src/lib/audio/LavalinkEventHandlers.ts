import { EmbedBuilder, TextChannel } from "discord.js";
import { BaeksuBotClient } from "../BaeksuBotClient";
import { formatDuration } from "@100su/utils";

export function registerLavalinkEvents(client: BaeksuBotClient) {
  const { lavalink } = client;

  // Node Events on nodeManager
  lavalink.nodeManager.on("connect", (node) => {
    client.logger.info(`[Lavalink] Node "${node.id}" connected successfully.`);
  });

  lavalink.nodeManager.on("error", (node, error) => {
    client.logger.error(`[Lavalink] Node "${node.id}" encountered an error:`, error);
  });

  lavalink.nodeManager.on("disconnect", (node, reason) => {
    client.logger.warn(`[Lavalink] Node "${node.id}" disconnected. Reason:`, reason);
  });

  // Player Events
  lavalink.on("trackStart", async (player, track) => {
    if (!player.textChannelId || !track) return;

    const channel = client.channels.cache.get(player.textChannelId) as TextChannel;
    if (!channel) return;

    const durationMs = track.info.duration ?? 0;
    const embed = new EmbedBuilder()
      .setColor("#5865F2") // Blurple
      .setTitle("🎶 현재 재생 중")
      .setDescription(`[${track.info.title}](${track.info.uri || track.info.identifier})`)
      .addFields(
        { name: "아티스트", value: track.info.author || "알 수 없음", inline: true },
        { name: "재생 시간", value: formatDuration(durationMs), inline: true },
        { name: "신청자", value: track.requester ? `<@${(track.requester as any).id || track.requester}>` : "알 수 없음", inline: true }
      )
      .setTimestamp();

    if (track.info.artworkUrl) {
      embed.setThumbnail(track.info.artworkUrl);
    }

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      client.logger.error("Failed to send trackStart message:", err);
    }
  });

  lavalink.on("queueEnd", async (player) => {
    if (!player.textChannelId) return;

    const channel = client.channels.cache.get(player.textChannelId) as TextChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor("#FEE75C") // Yellow
      .setTitle("⏹️ 재생 종료")
      .setDescription("대기열의 모든 곡 재생이 완료되었습니다.")
      .setTimestamp();

    try {
      await channel.send({ embeds: [embed] });
      
      // Auto-disconnect after 2 minutes of idle time
      setTimeout(async () => {
        const currentPlayer = lavalink.getPlayer(player.guildId);
        if (currentPlayer && currentPlayer.queue.tracks.length === 0 && !currentPlayer.playing) {
          await currentPlayer.destroy("idle-timeout");
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#ED4245")
                .setDescription("2분 동안 대기열이 비어있어 음성 채널에서 퇴장했습니다.")
            ]
          });
        }
      }, 120_000);
    } catch (err) {
      client.logger.error("Failed to send queueEnd message:", err);
    }
  });

  lavalink.on("trackError", async (player, track, payload) => {
    client.logger.error(`[Lavalink] Track play error in guild ${player.guildId}:`, payload);
    if (!player.textChannelId || !track) return;

    const channel = client.channels.cache.get(player.textChannelId) as TextChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor("#ED4245") // Red
      .setTitle("❌ 재생 에러 발생")
      .setDescription(`[${track.info.title || "곡"}] 재생 중 오류가 발생했습니다.`)
      .addFields({ name: "사유", value: `\`\`\`${(payload as any).error || "알 수 없는 에러"}\`\`\`` })
      .setTimestamp();

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      client.logger.error("Failed to send trackError message:", err);
    }
  });
}
