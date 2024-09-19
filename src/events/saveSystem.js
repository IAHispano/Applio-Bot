const { EmbedBuilder, Events, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const {
  JsonThread,
  FormatThread,
  uuid
} = require("../utils/savesystem.js");
const { createClient } = require("@supabase/supabase-js");
const client = require("../bot.js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_TOKEN,
);


async function VerifyModel(author_id, link_) {
  let link = link_.replace(/\?download=true/, "");
  let query = supabase
    .from("models")
    .select("*")
    .ilike("link", `%${link}%`)
    .order("created_at", { ascending: false });
  const { data, error } = await query.range(0, 14);
  if (error) {
    return { Result: "Not Found" };
  }
  if (data && data.length > 0) {
    for (const item of data) {
      if (item.author_id === author_id && item.link === link) {
        return { Result: "Founded", ModelID: item.id };
      } else if (item.link === link && item.author_id != author_id) {
        return { Result: "Steal", AuthorID: item.author_id };
      }
    }
  }
  return { Result: "Not Found" };
}

module.exports = {
  name: Events.ThreadCreate,
  once: false,
  async execute(thread) {
    try {
      const threadsChannels = [
        "1159289700490694666",
        "1124570199018967075",
        "1101148158819573790",
        "1175430844685484042",
        "1160799273546416188",
        "1184575112784134225",
        "1124524797804675172",
        "1116802604710760518",
        "1128748527271559209",
      ];

      if (!threadsChannels.includes(thread.parentId)) return;

      option = "aihub";
      let fetchedThread = await thread.fetch();
      console.log(fetchedThread.name, fetchedThread.id);
      fetchedThread = await thread.fetch().catch(async (error) => {
        fetchedThread = await thread.fetch();
      });

      let test;
      try {
        test = await fetchedThread.fetchStarterMessage();
      } catch {
        for (let i = 0; i < 15; i++) {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          try {
            fetchedThread = await thread.fetch();
            test = await fetchedThread.fetchStarterMessage();
            if (test && test.content) break;
          } catch {
            console.log("Failed Message First", fetchedThread.id);
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      if (
        fetchedThread.name.toLowerCase().includes("gptsovits") ||
        fetchedThread.name.toLowerCase().includes("gpt-sovits") ||
        fetchedThread.name.toLowerCase().includes("vits")
      ) {
        return;
      }

      const { contentToSave, result: jsonData } = await JsonThread(fetchedThread, test, option)
      if (!contentToSave || !jsonData) return;
      const ignoredOwners = [
        "1150230843214794822",
        "1175478584752750715",
        "1175436185179521128",
        "1175436031705751644",
        "1137921689133514793",
        "1184615269793013780",
      ];
      const ignoredServers = ["929985620984602665"];
      if (
        ignoredOwners.includes(jsonData.owner) ||
        ignoredServers.includes(jsonData.server) ||
        (test.author.bot && jsonData.owner !== "1144714449563955302") 
      ) {
        return;
      }
      
      
      const FormatResult = await FormatThread(jsonData);

      if(FormatResult.Status === "Failed") return;

      let Steal = false;
      const verify = await VerifyModel(FormatResult.Data.owner, FormatResult.Data.context.Link);
      if (verify.Result === "Steal") {
        Steal = verify.AuthorID;
      }
      // else if (verify.result === "Founded") {
      //   //return;
      // }

      const dataToUpload = {
        id: FormatResult.Data.id,
        id_: uuid(FormatResult.Data.id),
        name: FormatResult.Data.context.Name,
        link: FormatResult.Data.context.Link,
        image_url: verify.Image,
        type: "RVC",
        epochs: FormatResult.Data.context.Epoch,
        created_at: FormatResult.Data.upload,
        algorithm: FormatResult.Data.context.Algorithm,
        author_id: FormatResult.Data.owner,
        author_username: FormatResult.Data.owner_username,
        server_id: FormatResult.Data.server,
        server_name: FormatResult.Data.server_name,
        tags: FormatResult.Data.context.Tags.join(","),
      };
      if (verify.result === "Founded") {
        const { error: error_ } = await supabase
          .from("models")
          .delete()
          .eq("id", verify.ModelID);
        const { error } = await supabase.from("models").upsert([dataToUpload]);
        if (error) {
          console.log(error.message);
        } else {
          console.log(`Data reuploaded correctly, Org: ${verify.ModelID}`);
        }
      } else if (Steal === false) {
        const { error } = await supabase.from("models").upsert([dataToUpload]);
        if (error) {
          console.log(error.message);
        } else {
          console.log("Data uploaded correctly");
        }
      }
      try {
        const embed = new EmbedBuilder()
          .setTitle(`${FormatResult.Data.context.Name}`)
          .addFields(
            {
              name: "Server",
              value: `${FormatResult.Data.server} (${FormatResult.Data.server_name})`,
              inline: true,
            },
            {
              name: "Upload",
              value: new Date(FormatResult.Data.upload).toLocaleString(),
              inline: true,
            },
            { name: "Model Creator", value: `[@${FormatResult.Data.owner_username}](https://discordapp.com/users/${FormatResult.Data.owner}) (<@${FormatResult.Data.owner}>)`, inline: true },
            {
              name: "Algorithm",
              value: `${FormatResult.Data.context.Algorithm}`,
              inline: true,
            },
            {
              name: "Tags",
              value:
                FormatResult.Data.context.Tags.length > 0 ? FormatResult.Data.context.Tags.join(", ") : "Nothing",
              inline: false,
            },
          )
          .setImage(
            FormatResult.Image !== "N/A"
              ? FormatResult.Image
              : "https://github.com/IAHispano/Applio-Website/blob/main/public/no_bg_applio_logo.png?raw=true",
          )
          .setFooter({ text: `Fetch From ${FormatResult.Data.id}` });

        const ThreadButton = new ButtonBuilder()
          .setStyle(5)
          .setURL(`https://discord.com/channels/${thread.guild.id}/${test.channel.id}`)
          .setLabel("Go to Model")
          .setEmoji("↗");
        const LinkButton = new ButtonBuilder()
          .setStyle(5)
          .setURL(`${FormatResult.Data.context.Link}`)
          .setLabel("Link Model")
          .setEmoji("🪓");
          
        const row = new ActionRowBuilder().addComponents(ThreadButton, LinkButton);
        if (Steal != false) {
          embed.addFields({
            name: "Stolen",
            value: Steal,
            inline: false,
          });
          const res = await client.shard.broadcastEval(
            (c, context) => {
              const [embed, filePath, row] = context;
              try {
                const channel = c.channels.cache.get(process.env.LOG_CHANNEL_ID);
                if (channel) {
                  channel.send({ content: `<@989772388508000306>`, embeds: [embed], components: [row] });
                }
              } catch (error) {
                console.log(error);
              }
            },
            {
              context: [embed, `models/${fetchedThread.id}.json`, row],
            },
          );
        } else {
          const res = await client.shard.broadcastEval(
            (c, context) => {
              const [embed, filePath, row] = context;
              try {
                const channel = c.channels.cache.get(process.env.LOG_CHANNEL_ID);
                if (channel) {
                  channel.send({ embeds: [embed], components: [row] });
                }
              } catch (error) {
                console.log(error);
              }
            },
            {
              context: [embed, `models/${fetchedThread.id}.json`, row],
            },
          );
        }
      } catch (error) {
        console.error("Error fetching thread:", error);
      }
    } catch (error) {
      console.error("Error fetching thread:", error);
    }
  },
};
