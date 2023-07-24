import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { SearchResult } from "discord-player";
import { Track } from "discord-player";
import { ButtonStyle, TextInputStyle, VoiceBasedChannel } from "discord.js";
import { prisma } from "..";
import { playerHandler } from "./player";

export const modal = {
    search: () => {
        const modal = new ModalBuilder()
			.setCustomId('playerSearch')
			.setTitle('What do you want?');
        
        const query = new TextInputBuilder()
			.setCustomId('query')
			.setLabel("Search🔍")
			.setStyle(TextInputStyle.Short)
            .setMinLength(1);
        
        return modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(query)
        );
    }
}

export const selectMenu = {
    music: (results: SearchResult) => {
        const options: StringSelectMenuOptionBuilder[] = []
        for (var track of results.tracks) {
            options.push(
				new StringSelectMenuOptionBuilder()
                    .setLabel(`${track.description.slice(0, 100)}`)
                    .setDescription(`${track.duration}`)
                    .setValue(`${track.url}`),
            )
        }
        const menu = new StringSelectMenuBuilder()
            .setCustomId('musicSelection')
            .setPlaceholder('Select a music')
            .addOptions(options);
        
        return new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(menu);
    }
}

export const embed = {
    added: (track: Track) => {
        return new EmbedBuilder()
            .setColor(12345)
            .setTitle("🎵 Added on playlist.")
            .setDescription(track.title)
            .setURL(track.url)
            .setThumbnail(track.thumbnail)
            .setTimestamp()
    },
    error: () => {
        return new EmbedBuilder()
            .setColor(12345)
            .setTitle(`Something wrong...`)
    },
    start: (channel: VoiceBasedChannel) => {
        return new EmbedBuilder()
            .setColor(12345)
            .setTitle(`Start on https://discord.com/channels/${channel.guildId}/${channel.id}`)
    },
    already: (channel: VoiceBasedChannel) => {
        return new EmbedBuilder()
            .setColor(12345)
            .setTitle(`Already in https://discord.com/channels/${channel.guildId}/${channel.id}`)
    },
    needVC: () => {
        return new EmbedBuilder()
            .setColor(12345)
            .setTitle(`You are not connected to a voice channel`)
    },
    notFound: (query: string) => {
        return new EmbedBuilder()
            .setColor(12345)
            .setTitle(`"${query}" not found`)
    },
    player: async (channel: VoiceBasedChannel) => {
        var music = await playerHandler.musicNow(channel.guild);
        const Embed = new EmbedBuilder()
            .setColor(12345)
            .setTitle(`${music.description}`)
            .setDescription(`00:00 ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ${music.duration} `);

        if (music.url) {
            Embed.setURL(`${music.url}`);
            Embed.setThumbnail(`${music.thumbnail}`);
        }

        return Embed;
    }
}

export const button = {
    player: (paused: boolean) => {
        const random = new ButtonBuilder()
			.setCustomId('playerRandom')
			.setLabel('⇄ ')
			.setStyle(ButtonStyle.Secondary);
        const back = new ButtonBuilder()
            .setCustomId('playerBack')
            .setLabel('◁')
            .setStyle(ButtonStyle.Secondary);
        const pause = new ButtonBuilder()
            .setCustomId('playerPause')
            .setLabel('❚❚')
            .setStyle(ButtonStyle.Secondary);
        const next = new ButtonBuilder()
            .setCustomId('playerNext')
            .setLabel('▷')
            .setStyle(ButtonStyle.Secondary);
        const repeat = new ButtonBuilder()
            .setCustomId('playerRepeat')
            .setLabel('↻')
            .setStyle(ButtonStyle.Secondary);

        const dummyLeft = new ButtonBuilder()
            .setCustomId('dummyLeft')
            .setLabel('ㅤ')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        const add = new ButtonBuilder()
            .setCustomId('playerAdd')
            .setLabel('Add music')
            .setStyle(ButtonStyle.Success);
        const remove = new ButtonBuilder()
            .setCustomId('playerRemove')
            .setLabel('Remove this')
            .setStyle(ButtonStyle.Danger);
        const dummyRight = new ButtonBuilder()
            .setCustomId('dummyRight')
            .setLabel('ㅤ')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        return [
            new ActionRowBuilder<ButtonBuilder>()
			    .addComponents(random, back, pause, next, repeat),
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(dummyLeft, add, remove, dummyRight)
        ]
    }
}