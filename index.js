const axios = require("axios");
const defiLamaBaseUrl = "https://api.llama.fi/";
const coinGeckoBaseUrl = "https://api.coingecko.com/api/v3/";

const PROTOCOL_FETCH_INTERVAL = 1000 * 60 * 60; //1 hour
const protocolList = {};
/*

chain: cardano, 



*/

const fetchData = async (url, params = {}) => {
  try {
    const response = await axios.get(url, { params: params });
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const getTvl = async (chain) => {
  const data = await fetchData(`${defiLamaBaseUrl}chains`);
  const filtered = data.filter(
    (current) =>
      String(current.gecko_id).toLowerCase() === chain ||
      String(current.name).toLowerCase() === chain
  );
  return filtered.length == 0 ? 0 : filtered[0].tvl;
};

const getVolume = async (chain) => {
  const data = await fetchData(`${defiLamaBaseUrl}overview/dexs/${chain}`);
  return data;
};

const getCoinData = async (coin) => {
  const data = await fetchData(`${coinGeckoBaseUrl}coins/${coin}`, {
    localization: false,
    tickers: false,
    market_data: true,
    community_data: false,
    developer_data: false,
    developer_data: false,
    sparkline: false,
  });
  return data;
};

const getMcap = async (coin, currency = "eur") => {
  const data = await getCoinData(coin);
  return data.market_data.market_cap[currency];
};

const checkProtocolAdd = async (
  chainFilter = "all",
  includeCex = false,
  includeBridge = false
) => {
  const data = await fetchData(`${defiLamaBaseUrl}protocols`);
  if (chainFilter != "all") {
    const filtered = data.filter((current) => {
      if (current.symbol === "-") return false;
      if (!includeCex && current.category === "CEX") return false;
      if (!includeBridge && current.category === "Bridge") return false;
      const toLowerData = current.chains.map((a) => a.toLowerCase());
      return toLowerData.includes(chainFilter.toLowerCase());
    });

    const key = chainFilter + includeCex + includeBridge;
    const nameSymbol = filtered.map((current) => {
      return {
        name: current.name,
        symbol: current.symbol,
      };
    });

    if (protocolList[key] === undefined) {
      protocolList[key] = nameSymbol;
    } else {
      const difference = nameSymbol.filter(
        (x) => !protocolList[key].some((current) => x.name === current.name)
      );

      if (difference.length !== 0) {
        difference.map((x) => {
          console.log(`New Token found ${x.symbol} of ${x.name} protocol`);
        });
        protocolList[key] = nameSymbol;
      }
    }
  }
};

const main = async () => {
  console.log(await getTvl("milkomeda"));
  console.log((await getMcap("cardano", "usd")) / (await getTvl("cardano")));

  setInterval(() => {
    checkProtocolAdd("cardano");
  }, 2000);
};

main();
