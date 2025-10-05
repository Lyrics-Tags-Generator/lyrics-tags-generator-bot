const {
  ARTIST_INPUT_FIELD_CHARACTER_LIMIT_FORMATTED,
  CHANNEL_NAME_INPUT_FIELD_CHARACTER_LIMIT,
  FEATURES_INPUT_FIELD_CHARACTER_LIMIT,
  ARTIST_INPUT_FIELD_CHARACTER_LIMIT,
  TITLE_INPUT_FIELD_CHARACTER_LIMIT,
} = require("../../lib/constants");
const { interactionError } = require("../../lib/interaction-error");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("generate")
    .setDescription("Generate YouTube tags for your lyric videos.")
    .addStringOption((option) =>
      option
        .setName("artist")
        .setDescription("Any special characters are allowed except commas.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("format")
        .setDescription("Select the desired format.")
        .setChoices(
          { name: "Lyrics", value: "lyrics" },
          { name: "Bass Boosted", value: "bassboosted" },
          { name: "Nightcore/Sped Up", value: "nightcore" },
          { name: "Slowed/Reverb", value: "slowed" },
          { name: "Letra", value: "letra" },
          { name: "Testo", value: "testo" },
          { name: "Phonk", value: "phonk" }
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("genre")
        .setDescription("Select the desired genre.")
        .setChoices(
          { name: "None", value: "none" },
          { name: "Country", value: "country" },
          { name: "Latin", value: "latin" },
          { name: "Italian", value: "italian" },
          { name: "Phonk", value: "phonk" },
          { name: "Pop", value: "pop" },
          { name: "Rap", value: "rap" }
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Please remove any commas , if there are any")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("features")
        .setDescription("Please use a comma , to separate feature artists.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("Enter the name of the YouTube Channel.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("shuffle")
        .setDescription("Shuffle generated tags option.")
        .setChoices(
          { name: "Yes", value: "true" },
          { name: "No", value: "false" }
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("verse")
        .setDescription(
          "Popular verse? Paste them in here. Limit is 3, separate them by commas."
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("tiktok")
        .setDescription('Is the song popular on TikTok? Type "true" if so.')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const shuffle = interaction.options.getString("shuffle") || "true";
      const features = interaction.options.getString("features") || "";
      const channel = interaction.options.getString("channel") || "";
      const artist = interaction.options.getString("artist") || "";
      const tiktok = interaction.options.getString("tiktok") || "";
      const format = interaction.options.getString("format") || "";
      const title = interaction.options.getString("title") || "";
      const genre = interaction.options.getString("genre") || "";
      const verse = interaction.options.getString("verse") || "";

      if (/^,-/.test(artist)) {
        return interaction.reply({
          content: "Invalid format.",
          ephemeral: false,
        });
      }

      if (/,/.test(title)) {
        return interaction.reply({
          content: "Please remove any commas from the artist or title.",
          ephemeral: false,
        });
      }

      if (/[-,]/.test(artist)) {
        if (artist.length > ARTIST_INPUT_FIELD_CHARACTER_LIMIT_FORMATTED) {
          interaction.reply({
            content: "Character limit exceeded.",
            ephemeral: false,
          });
          return;
        }
      } else {
        if (artist.length > ARTIST_INPUT_FIELD_CHARACTER_LIMIT) {
          interaction.reply({
            content: "Character limit exceeded.",
            ephemeral: false,
          });
          return;
        }
      }

      if (title.length > TITLE_INPUT_FIELD_CHARACTER_LIMIT) {
        interaction.reply({
          content: "Character limit exceeded.",
          ephemeral: false,
        });
        return;
      }

      if (features.length > FEATURES_INPUT_FIELD_CHARACTER_LIMIT) {
        interaction.reply({
          content: "Character limit exceeded.",
          ephemeral: false,
        });
        return;
      }

      if (channel.length > CHANNEL_NAME_INPUT_FIELD_CHARACTER_LIMIT) {
        interaction.reply({
          content: "Character limit exceeded.",
          ephemeral: false,
        });
        return;
      }

      if (!/-/.test(artist)) {
        if (!title.length) {
          interaction.reply({
            content: "Please provide the title.",
            ephemeral: false,
          });
          return;
        }
      }

      if (verse.length && !/^[a-zA-Z ,]*$/.test(verse)) {
        interaction.reply({
          content: "Please remove any numbers or special characters.",
          ephemeral: false,
        });
        return;
      }

      if (verse.length && /,/.test(verse)) {
        const verseSplit = verse.split(",");

        if (verseSplit.length > 3) {
          interaction.reply({
            content: "You can only include 3 verses.",
            ephemeral: false,
          });

          return;
        }
      }

      const params = new URLSearchParams({
        artist: artist.includes("/") ? artist.split("/")[0] : artist,
        tiktok: tiktok === "true" ? "true" : "false",
        features: features?.trim() || "none",
        channel: channel?.trim() || "none",
        verse: verse?.trim() || "none",
        format: format || "lyrics",
        title: title || "none",
        genre: genre || "none",
        shuffle: shuffle,
      });

      const apiUrl = `https://tags.notnick.io/api/v1/generate?${params.toString()}`;

      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (!data.success) {
        return interaction.reply({ content: data.error, ephemeral: false });
      }

      const url = `https://tags.notnick.io${data.url}`;
      const hashtags = data.hashtags.map((hashtag) => `#${hashtag}`).join(" ");
      const featuresResponse = !data.features.length
        ? "None"
        : data.features.join(",");
      const responseId = data.responseId;
      const tags = data.removedTags;

      const embed = new EmbedBuilder()
        .setTitle(`${data.title} by ${data.artist}`)
        .setURL(url)
        .setColor("#FF0000")
        .addFields(
          { name: "Artist:", value: data.artist, inline: true },
          { name: "Title:", value: data.title, inline: true },
          { name: "Features:", value: featuresResponse, inline: true },
          {
            name: "Channel:",
            value: data.channel === "none" ? "None" : data.channel,
            inline: true,
          },
          { name: "Genre:", value: data.genre, inline: true },
          { name: "TikTok:", value: data.tiktok, inline: true },
          { name: "Tags:", value: tags },
          {
            name: "Hashtags:",
            value: hashtags,
            inline: true,
          },
          { name: "Length:", value: `${data.removedTagsLength}`, inline: true }
        )
        .setFooter({
          text: `tags.notnick.io`,
          iconURL: "https://tags.notnick.io/ltg.png",
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const filePath = "tags.txt";
      fs.writeFileSync(filePath, tags, "utf8");

      await interaction.followUp({
        content: "Here is your generated tags file:",
        files: [filePath],
      });

      if (artist.includes("/r")) {
        await interaction.followUp({
          content: `Response: **${responseId}**`,
          ephemeral: true,
        });
      }

      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete file: ${err}`);
      });
    } catch (error) {
      await interactionError(interaction, error);
    }
  },
};
