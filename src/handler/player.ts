import { Client, Guild, Message, VoiceBasedChannel } from "discord.js";
import { client, player, prisma } from "..";
import { GuildQueue, Track } from "discord-player";
import { embed } from "./builder";

export const playerHandler = {
    musicNow: async (guild: Guild) => {
        var music = await prisma.music.findMany({
            where: { 
                guildId: guild.id,
                state: "play" 
            }
        });

        if (music.length == 0){
            music = await prisma.music.findMany({
                where: { 
                    guildId: guild.id,
                    state: "end" 
                }
            });
        }

        return music[0];
    },
    selectMusic: async (guild: Guild) => {
        var music = await prisma.music.findFirst({
            where: {
                guildId: guild.id,
                state: "play"
            }
        })
        if (!music) {
            music = await prisma.music.findFirst({
                where: {
                    guildId: guild.id,
                    back: {  every: { state: "start" }},
                    state: "wait"
                }
            })
            if (!music) return null;
            await prisma.music.update({
                where: { id: music.id },
                data: { state: "play" }
            })
        }
        return music;
    },
    removeLastPlayer: async (guild: Guild) => {
        await prisma.guild.findUnique({
            where: { id: guild.id },
            include: { player: true }
        })
        .then(async guild => {
            if (!guild.player.length) return;
            const channel = await client.channels.fetch(guild.player[0].channelId);
            const message = await (channel as VoiceBasedChannel).messages.fetch(guild.player[0].messageId);

            await Promise.all([
                prisma.player.delete({
                    where: { id: guild.id}
                }),
                message.delete(),
            ])
        })
        .catch()
    },
    add: async (channel: VoiceBasedChannel, track: Track, metadata?: any) => {
        const end = await prisma.music.findFirst({
            where: {
                guildId: channel.guildId,
                state: "end" 
            },
            include: { back: true }
        });

        const music = await prisma.music.create({
            data: {
                url: track.url,
                description: track.description,
                thumbnail: track.thumbnail,
                duration: track.duration,
                guild: { 
                    connect: {
                        id: channel.guildId
                    }
                },
                back: { connect: { id: end.back[0].id }},
                next: { connect: { id: end.id }}
            },
            include:{
                back: true,
                next: true
            }
        });

        await prisma.music.update({
            where: { id: end.id },
            data: {
                back: {
                    disconnect: {
                        id: end.back[0].id
                    }
                }
            }
        })
        
        const playing = await prisma.music.findMany({
            where: { state: "play" }
        });
        if (playing.length == 0){
            const queue = player.nodes.get(channel.guildId);
            if (!queue.connection) await queue.connect(channel);
            await queue.play(track.url);

            await prisma.music.update({
                where: { id: music.id },
                data: { state: "play" }
            })
        }
    },
    updateUI: async (queue: GuildQueue) => {
        const player = await prisma.player.findUnique({ where: { id: queue.guild.id }});
        const channel = await client.channels.fetch(player.channelId);
        const message = await (channel as VoiceBasedChannel).messages.fetch(player.messageId)

        message.edit({ embeds: [await embed.player(queue.channel)]});
    }
}