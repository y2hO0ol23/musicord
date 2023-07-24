import 'dotenv/config';

import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import prepare from './handler';
import { PrismaClient } from '@prisma/client'
import { Player } from "discord-player"

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, any>;
    }
};

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
    ],
});
client.commands = new Collection();

export const prisma = new PrismaClient();
export const player = new Player(client);

prepare({ client: client, player: player }).then(() => {
    console.log(`${client.user.username} is ready!`);
})
