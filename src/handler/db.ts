import { Guild } from "discord.js"
import { prisma } from ".."

export const dbHandler = {
    createGuild: async (guild: Guild) => {
        const data = await prisma.guild.findUnique({
            where: { id: guild.id }
        })
        if (!data) {
            const data = await prisma.guild.create({
                data: { 
                    id: guild.id,
                    playList: {
                        create: [
                            {
                                state: "start",
                                url: "",
                                description: "",
                                thumbnail: "",
                                duration: ""
                            },
                            {
                                state: "end",
                                url: "",
                                description: "End of list",
                                thumbnail: "",
                                duration: "0:00"
                            }
                        ]
                    }
                },
                include: { playList: true }
            });
            await prisma.music.update({
                where: { id: data.playList[0].id },
                data: { next: { connect: { id: data.playList[1].id }}}
            })
        }
    }
}