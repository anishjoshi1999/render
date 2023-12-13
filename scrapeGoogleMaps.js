const cheerio = require("cheerio");
const puppeteerExtra = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const BusinessModel = require("./business");

async function searchGoogleMaps(value, state) {
  try {
    const start = Date.now();

    puppeteerExtra.use(stealthPlugin());

    const browser = await puppeteerExtra.launch({
      headless: "new",
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    const page = await browser.newPage();

    const query = `${value}`;

    try {
      await page.goto(
        `https://www.google.com/maps/search/${query.split(" ").join("+")}`
      );
    } catch (error) {
      console.log("error going to page");
    }

    async function autoScroll(page) {
      await page.evaluate(async () => {
        const wrapper = document.querySelector('div[role="feed"]');

        await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 1000;
          var scrollDelay = 3000;

          var timer = setInterval(async () => {
            var scrollHeightBefore = wrapper.scrollHeight;
            wrapper.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeightBefore) {
              totalHeight = 0;
              await new Promise((resolve) => setTimeout(resolve, scrollDelay));

              var scrollHeightAfter = wrapper.scrollHeight;

              if (scrollHeightAfter > scrollHeightBefore) {
                return;
              } else {
                clearInterval(timer);
                resolve();
              }
            }
          }, 200);
        });
      });
    }

    await autoScroll(page);

    const html = await page.content();
    const pages = await browser.pages();
    await Promise.all(pages.map((page) => page.close()));

    await browser.close();
    console.log("browser closed");

    const $ = cheerio.load(html);
    const aTags = $("a");
    const parents = [];

    aTags.each((i, el) => {
      const href = $(el).attr("href");
      if (!href) {
        return;
      }
      if (href.includes("/maps/place/")) {
        parents.push($(el).parent());
      }
    });

    console.log("parents", parents.length);

    const businesses = [];

    parents.forEach(async (parent) => {
      const url = parent.find("a").attr("href");
      // console.log(url);
      const storeName = parent.find("div.fontHeadlineSmall").text();
      const bodyDiv = parent.find("div.fontBodyMedium").first();
      const children = bodyDiv.children();
      const lastChild = children.last();
      const firstOfLast = lastChild.children().first();
      const lastOfLast = lastChild.children().last();
      const website = parent.find(".S9kvJb").attr("href");

      let business = {
        storeName,
        address: firstOfLast?.text()?.split("·")?.[1]?.trim(),
        url,
        phone: lastOfLast?.text()?.split("·")?.[1]?.trim(),
        Website: website,
        state,
      };

      try {
        const businessInstance = new BusinessModel(business);
        const savedBusiness = await businessInstance.save();
        businesses.push(savedBusiness);
        console.log(`Business inserted: ${savedBusiness}`);
      } catch (error) {
        console.error("Error inserting business into MongoDB:", error.message);
      }
    });

    const end = Date.now();
    console.log(`time in seconds ${Math.floor((end - start) / 1000)}`);
  } catch (error) {
    console.log("error at googleMaps", error.message);
  }
}
module.exports = { searchGoogleMaps };
