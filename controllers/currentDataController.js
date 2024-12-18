const { getLiveAssetPrice, getCompleteLiveAssetData } = require(`../utils/cryptoPrices`);

const currentAssetPrice = async (req, res) => {
    const assetName = req.params.name.toLowerCase();

    try {
        const price = await getLiveAssetPrice(assetName);
        if (price === 0) {
            return res.status(404).json({ error: `Asset ${assetName} not found` });
        }
        res.status(200).json({ asset: assetName, price });
    } catch (error) {
        console.error(`Error fetching asset price for ${assetName}: `, error.message);
        res.status(500).json({ error: 'Internet server error' });
    }
}

const completeAssetReport = async (req, res) => {
    const assetName = req.params.name.toLowerCase();

    try {
        const completeReport = await getCompleteLiveAssetData(assetName);
        if (!completeReport) {
            return res.status(404).json({ 
                error: `Coin ${assetName} not found.`,
                suggestion: 'Please ensure the coin name is correct or refer to the available assests list.' 
            });
        }
        res.status(200).json({ 
            name: completeReport[0].name,
            symbol: completeReport[0].symbol,
            image: completeReport[0].image,
            price: completeReport[0].current_price,
            market_cap: completeReport[0].current_price,
            maket_cap_rank: completeReport[0].current_price,
            fully_diluted_valuation: completeReport[0].fully_diluted_valuation,
            total_volume: completeReport[0].total_volume,
            high_24h: completeReport[0].high_24h,
            low_24h: completeReport[0].low_24h,
            price_change_24h: completeReport[0].price_change_24h,
            price_change_percent_24h: completeReport[0].price_change_percentage_24h,
            market_cap_change_24h: completeReport[0].market_cap_change_24h,
            market_cap_change_percent_24h: completeReport[0].market_cap_change_percentage_24h,
            circulating_supply: completeReport[0].circulating_supply,
            total_supply: completeReport[0].total_supply,
            max_supply: completeReport[0].max_supply,
            ath: completeReport[0].ath,
            ath_date: completeReport[0].ath_date,
            ath_change_percentage: completeReport[0].ath_change_percentage,
            atl: completeReport[0].atl,
            atl_date: completeReport[0].atl_date,
            atl_change_percentage: completeReport[0].atl_change_percentage,
        });
    } catch (error) {
        console.error(`Error fetching asset full report for ${assetName}: `, error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { currentAssetPrice, completeAssetReport };