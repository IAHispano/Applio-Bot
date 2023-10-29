const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription(
      `Utility » Set yourself as AFK on the server and prevent anyone from mentioning you.`,
    )
    .setDescriptionLocalizations({
      "es-ES":
        "Utility » Establécete como AFK en el servidor y evita que nadie te mencione.",
    })
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setNameLocalizations({
          "es-ES": "iniciar",
        })
        .setDescription(
          "Utility » Set yourself as AFK on the server and prevent anyone from mentioning you.",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Utility » Establécete como AFK en el servidor y evita que nadie te mencione.",
        })
        .addStringOption((option) =>
          option
            .setName("reason")
            .setNameLocalizations({
              "es-ES": "razón",
            })
            .setRequired(false)
            .setDescription(`Give the reason why you want to be AFK.`)
            .setDescriptionLocalizations({
              "es-ES": "Especifica la razón por la que quieres estar AFK.",
            }),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("end")
        .setNameLocalizations({
          "es-ES": "finalizar",
        })
        .setDescription(
          "Utility » Stop being AFK on the server and re-enable mentions.",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Utility » Deja de estar AFK en el servidor y vuelve a activar las menciones.",
        }),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("force-remove")
        .setNameLocalizations({
          "es-ES": "forzar-remover",
        })
        .setDescription(
          "Utility » Remove the AFK status to another user (Moderators only).",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Utility » Quitar el estado AFK a otro usuario (Sólo moderadores).",
        })

        .addUserOption((option) =>
          option
            .setName("user")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setRequired(true)
            .setDescription(`The user to remove from AFK.`)
            .setDescriptionLocalizations({
              "es-ES": "El usuario al que quitar el estado AFK.",
            }),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription(
          "Utility » Get all the info on who is AFK on the server (Moderators only).",
        )
        .setDescriptionLocalizations({
          "es-ES":
            "Utility » Obtén toda la información sobre quién está AFK en el servidor (Sólo moderadores).",
        }),
    ),
  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      await interaction.guild.autoModerationRules.fetch();
      const rule = await interaction.guild.autoModerationRules.cache.find(
        (x) => x.name === "AFK mention block",
      );
      if (subcommand === "start") {
        const reason = interaction.options.get("reason")?.value ?? "I'm AFK :)";

        if (!rule) {
          const keywords = [`<@1>`, `<@${interaction.user.id}>`];
          await interaction.guild.autoModerationRules.create({
            name: "AFK mention block",
            enabled: true,
            eventType: 1,
            triggerType: 1,
            triggerMetadata: {
              keywordFilter: keywords,
            },
            actions: [
              {
                type: 1,
                metadata: {
                  customMessage:
                    "This user is currently AFK, I have blocked this message to prevent disturbing them",
                },
              },
            ],
          });
        } else {
          if (
            rule.triggerMetadata.keywordFilter.includes(
              `<@${interaction.user.id}>`,
            )
          ) {
            return interaction.reply(
              `You are already AFK, to end it try </afk end:1163566324530819096>`,
            );
          }
          const keywords = await rule.triggerMetadata.keywordFilter;
          keywords.push(`<@${interaction.user.id}>`);
          rule.edit({
            triggerMetadata: {
              keywordFilter: keywords,
            },
          });
        }
        try {
          const nickname =
            interaction.member.nickname ||
            interaction.user.displayname ||
            interaction.user.username;
          if (nickname.length < 27) {
            const name = `[AFK] ${nickname}`;
            await interaction.member.setNickname(name);
          }
          await interaction.reply(
            `**${interaction.user.username}** is now AFK: ${reason}`,
          );
        } catch (error) {
          await interaction.reply(
            `**${interaction.user.username}** is now AFK: ${reason}`,
          );
          interaction.followUp({
            content: `Unable to change your nickname, it seems it don't have the right permissions do to do.`,
            ephemeral: true,
          });
        }
      } else if (subcommand === "end") {
        {
          if (
            !rule ||
            !rule.triggerMetadata.keywordFilter.includes(
              `<@${interaction.user.id}>`,
            )
          ) {
            return interaction.reply(
              `You are not AFK, to start it try </afk start:1163566324530819096>`,
            );
          }

          let keywords = await rule.triggerMetadata.keywordFilter;
          keywords = keywords.filter(
            (words) => words !== `<@${interaction.user.id}>`,
          );
          rule.edit({
            triggerMetadata: {
              keywordFilter: keywords,
            },
          });
          const name =
            interaction.member.nickname ||
            interaction.user.displayname ||
            interaction.user.username;
          if (name.startsWith("[AFK]")) {
            const newname = name.slice(6);
            await interaction.member.setNickname(newname);
          }
          await interaction.reply(
            `${interaction.member} welcome back, the pings are back on!`,
          );
        }
      } else if (subcommand === "force-remove") {
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.ModerateMembers,
          )
        ) {
          return interaction.reply({
            content: `You do not have the permissions needed to do so`,
            ephemeral: true,
          });
        }
        const user = interaction.options.getUser("user");
        const member = interaction.options.getMember("user");
        if (
          !rule ||
          !rule.triggerMetadata.keywordFilter.includes(`<@${user.id}>`)
        ) {
          return interaction.channel.send(`This user is not AFK`);
        }

        let keywords = await rule.triggerMetadata.keywordFilter;
        keywords = keywords.filter((words) => words !== `<@${user.id}>`);
        rule.edit({
          triggerMetadata: {
            keywordFilter: keywords,
          },
        });
        const name = member.nickname || user.displayname || user.username;
        if (name.startsWith("[AFK]")) {
          const newname = name.slice(6);
          await member.setNickname(newname);
        }
        interaction.reply(
          `The user ${user} has succesfully been force removed from AFK status`,
        );
      } else if (subcommand === "info") {
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.ModerateMembers,
          )
        ) {
          return interaction.reply({
            content: `You do not have the permissions needed to do so`,
            ephemeral: true,
          });
        } else {
          if (!rule) {
            return interaction.channel.send(
              `It seems like no one has ever been AFK in this server`,
            );
          }

          let keywords = await rule.triggerMetadata.keywordFilter;
          keywords = keywords.filter((words) => words !== `<@1>`);
          const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle(`AFK Users`)
            .setFooter({
              text: `Requested by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setColor("Blurple")
            .setTimestamp();
          const loop = keywords.length;
          if (loop === 0) {
            embed.setDescription(`No users AFK...`);
          } else if (loop < 11) {
            let afkusers = "";
            for (let i = 0; i < loop; i++) {
              if (i + 1 < loop) {
                const userId = keywords[i].match(/\d+/)[0];

                const member = await interaction.guild.members.fetch(userId);
                const user = await interaction.client.users.fetch(userId);
                const name =
                  member.nickname || user.displayname || user.username;

                afkusers += `${name}\n`;
              } else {
                const userId = keywords[i].match(/\d+/)[0];
                const member = await interaction.guild.members.fetch(userId);
                const user = await interaction.client.users.fetch(userId);
                const name =
                  member.nickname || user.displayname || user.username;

                afkusers += `${name}\n`;
              }
            }
            embed.setDescription(afkusers);
          } else {
            embed.setDescription(afkusers);
          }

          interaction.reply({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.log(error);
      interaction.reply({
        content:
          "I have not been able to execute this command as I do not have the necessary permissions to create moderation rules to prevent you from being mentioned!",
        ephemeral: true,
      });
    }
  },
};
