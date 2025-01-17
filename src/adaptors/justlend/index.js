const utils = require('../utils');

const API_URL = 'https://labc.ablesdxd.link/justlend/yieldInfos';

const getMarketDetails = async (tokedAddress) => {
  const details = await utils.getData(
    `https://labc.ablesdxd.link/justlend/markets/jtokenDetails?jtokenAddr=${tokedAddress}`
  );

  return details;
};

const getRewardApy = async (marketsData) => {
  const tokens = marketsData.map(
    ({ data: { jtokenAddress } }) => jtokenAddress
  );
  const tvls = marketsData.map(({ data: { depositedUSD } }) => depositedUSD);
  const rewards = await utils.getData(
    `https://labc.ablesdxd.link/sunProject/tronbull?pool=${tokens.join(
      ','
    )}&tvl=${tvls.join(',')}`
  );

  return rewards;
};

const getApy = async () => {
  const tokensData = await utils.getData(API_URL);
  const tokensAddress = tokensData.data.assetList.map(
    ({ jtokenAddress }) => jtokenAddress
  );

  const marketsData = await Promise.all(tokensAddress.map(getMarketDetails));
  const { data: rewards } = await getRewardApy(marketsData);

  const pools = marketsData.map(({ data: market }) => {
    return {
      pool: market.jtokenAddress,
      chain: utils.formatChain('tron'),
      project: 'justlend',
      symbol: market.collateralSymbol,
      tvlUsd: Number(market.depositedUSD) - Number(market.borrowedUSD),
      apy:
        ((Number(market.earnUSDPerDay) * 365) / Number(market.depositedUSD)) *
          100 +
        rewards[market.jtokenAddress][
          market.collateralSymbol === 'USDD' ? 'USDDNEW' : 'JSTNEW'
        ] *
          100,
    };
  });

  return pools;
};

module.exports = {
  timetravel: false,
  apy: getApy,
};
