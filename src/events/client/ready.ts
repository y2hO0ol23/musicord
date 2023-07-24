import { Guild, VoiceBasedChannel } from "discord.js";
import { client, prisma } from "../..";
import { playerHandler } from "../../handler/player";
import { dbHandler } from "../../handler/db";

client.once("ready", () => {
    client.guilds.cache.forEach(async (guild: Guild) => {
        await dbHandler.createGuild(guild);
        
        await playerHandler.removeLastPlayer(guild);
    });
})