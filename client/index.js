require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState, EndBehaviorType } = require('@discordjs/voice');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { startRecording } = require('./utils/audioProcessor');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayintBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const SERVER_URL = process.env.SERVER_URL;

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('voiceStateUpdate', async (oldState, newState) => {
  const userId = newState.member.id;
  const sessionId = `${userId}_${Date.now()}`;

  // User joined a voice channel
  if (!oldState.channelId && newState.channelId) {
    console.log(`User ${userId} joined channel ${newState.channelId}`);

    const connection = joinVoiceChannel({
      channelId: newState.channelId,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    // Wait for connection to be ready
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

      // In a real implementation, we would get the audio stream from the connection here.
      // For this skeleton, we simulate the process with a dummy stream or placeholder logic.
      console.log(`Recording started for session: ${sessionId}`);

      // This is where we'd hook into the actual audio receiver/stream
      // and pipe it to our startRecording function.

    } catch (error) {
      console.error('Failed to join voice channel:', error);
    }
  }

  // User left a voice channel
  if (oldState.channelId && !newState.channelId) {
    console.log(`User ${userId} left channel`);
    // Logic to stop recording, convert file, and upload via axios to SERVER_URL
    // ...
  }
});

client.login(process.env.DISCORD_TOKEN);
