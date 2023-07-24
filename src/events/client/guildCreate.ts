import { Guild } from "discord.js";
import { client, prisma } from "../..";
import { dbHandler } from "../../handler/db";

client.on("guildCreate", async (guild: Guild) => {
    await dbHandler.createGuild(guild);
});