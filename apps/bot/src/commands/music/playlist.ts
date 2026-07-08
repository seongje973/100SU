import { Command } from "@sapphire/framework";
import { ApplicationCommandRegistry } from "@sapphire/framework";
import { GuildMember, EmbedBuilder } from "discord.js";
import { BaeksuBotClient } from "../../lib/BaeksuBotClient";
import { formatDuration, chunkArray } from "@100su/utils";

export class PlaylistCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "커스텀 플레이리스트를 관리 및 재생합니다.",
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    // English command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("playlist")
        .setDescription("커스텀 플레이리스트 관리 도구")
        // create
        .addSubcommand((sub) =>
          sub
            .setName("create")
            .setDescription("새 플레이리스트를 생성합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("생성할 플레이리스트 이름").setRequired(true))
        )
        // add
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("플레이리스트에 곡을 검색하여 추가합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("플레이리스트 이름").setRequired(true))
            .addStringOption((opt) => opt.setName("노래").setDescription("추가할 노래 제목 또는 URL").setRequired(true))
        )
        // remove
        .addSubcommand((sub) =>
          sub
            .setName("remove")
            .setDescription("플레이리스트에서 곡을 삭제합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("플레이리스트 이름").setRequired(true))
            .addIntegerOption((opt) => opt.setName("번호").setDescription("삭제할 곡 번호 (1번부터)").setRequired(true))
        )
        // play
        .addSubcommand((sub) =>
          sub
            .setName("play")
            .setDescription("플레이리스트의 모든 곡을 대기열에 불러와 재생합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("플레이리스트 이름").setRequired(true))
        )
        // list
        .addSubcommand((sub) =>
          sub.setName("list").setDescription("내 커스텀 플레이리스트 목록을 봅니다.")
        )
        // info
        .addSubcommand((sub) =>
          sub
            .setName("info")
            .setDescription("플레이리스트 수록곡 목록을 상세히 조회합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("플레이리스트 이름").setRequired(true))
            .addIntegerOption((opt) => opt.setName("페이지").setDescription("페이지 번호").setRequired(false).setMinValue(1))
        )
        // delete
        .addSubcommand((sub) =>
          sub
            .setName("delete")
            .setDescription("플레이리스트를 완전히 삭제합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("삭제할 플레이리스트 이름").setRequired(true))
        )
    );

    // Korean command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("플레이리스트")
        .setDescription("커스텀 플레이리스트 관리 도구")
        // create
        .addSubcommand((sub) =>
          sub
            .setName("create")
            .setDescription("새 플레이리스트를 생성합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("생성할 플레이리스트 이름").setRequired(true))
        )
        // add
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("플레이리스트에 곡을 검색하여 추가합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("플레이리스트 이름").setRequired(true))
            .addStringOption((opt) => opt.setName("노래").setDescription("추가할 노래 제목 또는 URL").setRequired(true))
        )
        // remove
        .addSubcommand((sub) =>
          sub
            .setName("remove")
            .setDescription("플레이리스트에서 곡을 삭제합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("플레이리스트 이름").setRequired(true))
            .addIntegerOption((opt) => opt.setName("번호").setDescription("삭제할 곡 번호 (1번부터)").setRequired(true))
        )
        // play
        .addSubcommand((sub) =>
          sub
            .setName("play")
            .setDescription("플레이리스트의 모든 곡을 대기열에 불러와 재생합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("플레이리스트 이름").setRequired(true))
        )
        // list
        .addSubcommand((sub) =>
          sub.setName("list").setDescription("내 커스텀 플레이리스트 목록을 봅니다.")
        )
        // info
        .addSubcommand((sub) =>
          sub
            .setName("info")
            .setDescription("플레이리스트 수록곡 목록을 상세히 조회합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("플레이리스트 이름").setRequired(true))
            .addIntegerOption((opt) => opt.setName("페이지").setDescription("페이지 번호").setRequired(false).setMinValue(1))
        )
        // delete
        .addSubcommand((sub) =>
          sub
            .setName("delete")
            .setDescription("플레이리스트를 완전히 삭제합니다.")
            .addStringOption((opt) => opt.setName("이름").setDescription("삭제할 플레이리스트 이름").setRequired(true))
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const client = this.container.client as BaeksuBotClient;
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    // Ensure User exists in DB
    await client.db.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    try {
      if (subcommand === "create") {
        return this.handleCreate(interaction, client, userId);
      } else if (subcommand === "add") {
        return this.handleAdd(interaction, client, userId);
      } else if (subcommand === "remove") {
        return this.handleRemove(interaction, client, userId);
      } else if (subcommand === "play") {
        return this.handlePlay(interaction, client, userId);
      } else if (subcommand === "list") {
        return this.handleList(interaction, client, userId);
      } else if (subcommand === "info") {
        return this.handleInfo(interaction, client, userId);
      } else if (subcommand === "delete") {
        return this.handleDelete(interaction, client, userId);
      }
    } catch (err) {
      client.logger.error(`Error running /playlist ${subcommand}:`, err);
      return interaction.replied || interaction.deferred
        ? interaction.editReply("❌ 명령을 수행하는 도중 에러가 발생했습니다.")
        : interaction.reply({ content: "❌ 명령을 수행하는 도중 에러가 발생했습니다.", ephemeral: true });
    }
  }

  private async handleCreate(interaction: Command.ChatInputCommandInteraction, client: BaeksuBotClient, userId: string) {
    const name = interaction.options.getString("이름", true);

    const existing = await client.db.playlist.findUnique({
      where: {
        userId_name: { userId, name },
      },
    });

    if (existing) {
      return interaction.reply({
        content: `❌ 이미 **${name}** 이름의 플레이리스트가 존재합니다.`,
        ephemeral: true,
      });
    }

    await client.db.playlist.create({
      data: {
        userId,
        name,
      },
    });

    return interaction.reply(`✅ 새 플레이리스트 **${name}**이 생성되었습니다.`);
  }

  private async handleAdd(interaction: Command.ChatInputCommandInteraction, client: BaeksuBotClient, userId: string) {
    const name = interaction.options.getString("이름", true);
    const songQuery = interaction.options.getString("노래", true);
    const { guild, channel } = interaction;

    if (!guild || !channel) return;

    await interaction.deferReply();

    const playlist = await client.db.playlist.findUnique({
      where: { userId_name: { userId, name } },
    });

    if (!playlist) {
      return interaction.editReply(`❌ 플레이리스트 **${name}**을 찾을 수 없습니다. \`/playlist create\`로 먼저 만들어주세요.`);
    }

    // Create a temporary player for searching if player does not exist
    let player = client.lavalink.getPlayer(guild.id);
    let createdPlayer = false;

    if (!player) {
      player = client.lavalink.createPlayer({
        guildId: guild.id,
        voiceChannelId: "0", // placeholder
        textChannelId: channel.id,
        selfDeaf: true,
      });
      createdPlayer = true;
    }

    try {
      const searchResult = await player.search(
        {
          query: songQuery,
          source: songQuery.startsWith("http") ? undefined : "youtube",
        },
        interaction.user
      );

      if (createdPlayer) {
        await player.destroy("playlist-search-cleanup");
      }

      if (searchResult.loadType === "empty" || !searchResult.tracks.length) {
        return interaction.editReply("❌ 음색 검색 결과를 찾을 수 없습니다.");
      }
      if (searchResult.loadType === "error") {
        return interaction.editReply("❌ 음원을 검색하는 중 에러가 발생했습니다.");
      }

      const addedSongs: any[] = [];
      const songCount = await client.db.song.count({
        where: { playlistId: playlist.id },
      });

      if (searchResult.loadType === "playlist") {
        const tracks = searchResult.tracks;
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          addedSongs.push({
            playlistId: playlist.id,
            title: track.info.title,
            author: track.info.author || "알 수 없음",
            url: track.info.uri || track.info.identifier,
            duration: track.info.duration ?? 0,
            thumbnail: track.info.artworkUrl || null,
            lavalinkInfo: track as any,
            position: songCount + i,
          });
        }
      } else {
        const track = searchResult.tracks[0];
        addedSongs.push({
          playlistId: playlist.id,
          title: track.info.title,
          author: track.info.author || "알 수 없음",
          url: track.info.uri || track.info.identifier,
          duration: track.info.duration ?? 0,
          thumbnail: track.info.artworkUrl || null,
          lavalinkInfo: track as any,
          position: songCount,
        });
      }

      // Save songs to DB
      await client.db.$transaction(
        addedSongs.map((song: any) =>
          client.db.song.create({
            data: song,
          })
        )
      );

      if (searchResult.loadType === "playlist") {
        return interaction.editReply(`✅ 플레이리스트 **${searchResult.playlist?.name}** (${searchResult.tracks.length}곡)을 커스텀 플레이리스트 **${name}**에 추가했습니다.`);
      } else {
        return interaction.editReply(`✅ **${searchResult.tracks[0].info.title}** 곡을 커스텀 플레이리스트 **${name}**에 추가했습니다.`);
      }
    } catch (err) {
      if (createdPlayer && player) {
        await player.destroy("playlist-search-cleanup");
      }
      throw err;
    }
  }

  private async handleRemove(interaction: Command.ChatInputCommandInteraction, client: BaeksuBotClient, userId: string) {
    const name = interaction.options.getString("이름", true);
    const index = interaction.options.getInteger("번호", true);

    const playlist = await client.db.playlist.findUnique({
      where: { userId_name: { userId, name } },
      include: { songs: { orderBy: { position: "asc" } } },
    });

    if (!playlist) {
      return interaction.reply({
        content: `❌ 플레이리스트 **${name}**을 찾을 수 없습니다.`,
        ephemeral: true,
      });
    }

    const songIndex = index - 1;
    if (songIndex < 0 || songIndex >= playlist.songs.length) {
      return interaction.reply({
        content: `❌ 유효하지 않은 인덱스입니다. (1 ~ ${playlist.songs.length} 사이)`,
        ephemeral: true,
      });
    }

    const targetSong = playlist.songs[songIndex];

    await client.db.$transaction([
      // Delete the target song
      client.db.song.delete({ where: { id: targetSong.id } }),
      // Decrement position of subsequent songs
      client.db.song.updateMany({
        where: {
          playlistId: playlist.id,
          position: { gt: targetSong.position },
        },
        data: {
          position: { decrement: 1 },
        },
      }),
    ]);

    return interaction.reply(`✅ 플레이리스트 **${name}**에서 **${targetSong.title}** 곡을 삭제했습니다.`);
  }

  private async handlePlay(interaction: Command.ChatInputCommandInteraction, client: BaeksuBotClient, userId: string) {
    const name = interaction.options.getString("이름", true);
    const { guild, member, channel } = interaction;

    if (!guild || !member || !channel) return;

    const voiceChannel = (member as GuildMember).voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ 먼저 음성 채널에 입장해 주세요.",
        ephemeral: true,
      });
    }

    const botMember = guild.members.me;
    if (botMember?.voice.channel && botMember.voice.channel.id !== voiceChannel.id) {
      return interaction.reply({
        content: "❌ 봇이 이미 다른 음성 채널에서 사용 중입니다.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const playlist = await client.db.playlist.findUnique({
      where: { userId_name: { userId, name } },
      include: { songs: { orderBy: { position: "asc" } } },
    });

    if (!playlist || playlist.songs.length === 0) {
      return interaction.editReply(`❌ 플레이리스트 **${name}**이 존재하지 않거나 수록곡이 없습니다.`);
    }

    // Get guild volume from DB
    const dbGuild = await client.db.guild.findUnique({
      where: { id: guild.id },
    });
    const defaultVolume = dbGuild?.volume ?? 100;

    let player = client.lavalink.getPlayer(guild.id);
    if (!player) {
      player = client.lavalink.createPlayer({
        guildId: guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: channel.id,
        selfDeaf: true,
        volume: defaultVolume,
      });
    }

    if (!player.connected) {
      await player.connect();
    }

    // Reconstruct lavalink track objects from JSON
    const tracksToPlay = playlist.songs.map((song: any) => {
      // Direct type assertion since we stored it
      return song.lavalinkInfo as any;
    });

    try {
      await player.queue.add(tracksToPlay);
      if (!player.playing) {
        await player.play();
      }

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎶 커스텀 플레이리스트 재생")
        .setDescription(`플레이리스트 **${name}**의 **${tracksToPlay.length}곡**을 대기열에 추가하고 재생을 시작합니다.`)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      client.logger.error("Error loading tracks to player:", err);
      return interaction.editReply("❌ 플레이리스트 곡을 대기열에 추가하는 중 문제가 발생했습니다.");
    }
  }

  private async handleList(interaction: Command.ChatInputCommandInteraction, client: BaeksuBotClient, userId: string) {
    const playlists = await client.db.playlist.findMany({
      where: { userId },
      include: { _count: { select: { songs: true } } },
    });

    if (playlists.length === 0) {
      return interaction.reply("⏹️ 등록된 플레이리스트가 없습니다. `/playlist create` 명령어로 생성해 보세요!");
    }

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📋 내 플레이리스트 목록")
      .setDescription(
        playlists
          .map((pl: any, idx: number) => `\`${idx + 1}.\` **${pl.name}** (${pl._count.songs}곡)`)
          .join("\n")
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  private async handleInfo(interaction: Command.ChatInputCommandInteraction, client: BaeksuBotClient, userId: string) {
    const name = interaction.options.getString("이름", true);
    const page = interaction.options.getInteger("페이지") || 1;

    const playlist = await client.db.playlist.findUnique({
      where: { userId_name: { userId, name } },
      include: { songs: { orderBy: { position: "asc" } } },
    });

    if (!playlist) {
      return interaction.reply({
        content: `❌ 플레이리스트 **${name}**을 찾을 수 없습니다.`,
        ephemeral: true,
      });
    }

    if (playlist.songs.length === 0) {
      return interaction.reply(`ℹ️ 플레이리스트 **${name}**이 비어 있습니다. \`/playlist add\`로 곡을 추가해보세요!`);
    }

    const pageSize = 10;
    const chunks = chunkArray(playlist.songs, pageSize);
    const totalPages = chunks.length;

    if (page > totalPages) {
      return interaction.reply({
        content: `❌ 존재하지 않는 페이지입니다. (총 페이지 수: ${totalPages})`,
        ephemeral: true,
      });
    }

    const currentPageSongs = chunks[page - 1];
    const startIndex = (page - 1) * pageSize;

    const songList = currentPageSongs
      .map((song: any, idx: number) => {
        const globalIdx = startIndex + idx + 1;
        return `\`${globalIdx}.\` **${song.title}** - \`${formatDuration(song.duration ?? 0)}\` (아티스트: *${song.author}*)`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`📋 플레이리스트 상세: ${playlist.name}`)
      .setDescription(songList)
      .setFooter({ text: `페이지 ${page}/${totalPages} | 총 ${playlist.songs.length}곡` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  private async handleDelete(interaction: Command.ChatInputCommandInteraction, client: BaeksuBotClient, userId: string) {
    const name = interaction.options.getString("이름", true);

    const playlist = await client.db.playlist.findUnique({
      where: { userId_name: { userId, name } },
    });

    if (!playlist) {
      return interaction.reply({
        content: `❌ 플레이리스트 **${name}**을 찾을 수 없습니다.`,
        ephemeral: true,
      });
    }

    await client.db.playlist.delete({
      where: { id: playlist.id },
    });

    return interaction.reply(`✅ 플레이리스트 **${name}**을 성공적으로 삭제했습니다.`);
  }
}
