const axios = require('axios');
const Asset = require('../model/Asset');

const getLiveAssetPrice = async (coin) => {
    try {
        const response = await axios.get(
            `${process.env.COIN_TRACKER_BASE_URL}/simple/price?ids=${coin}&vs_currencies=usd`,
            {
                headers: {
                    Accept: 'application/json',
                    'x-cg-demo-api-key': 'CG-7w2SPHTkWPCD1NWKQvDQCbvF'
                }
            }    
        )

        const price = response.data[coin].usd;
        return price;
    } catch (error) {
        console.error(`Error fetching live prices for ${coin}: `, error.message);
        return 0;
    }
};

const getCompleteLiveAssetData = async (coin) => {
    try {
        const response = await axios.get(
            `${process.env.COIN_TRACKER_BASE_URL}/coins/markets?vs_currency=usd&ids=${coin}`,
            {
                headers: {
                    Accept: 'application/json',
                    'x-cg-demo-api-key': 'CG-7w2SPHTkWPCD1NWKQvDQCbvF'
                }
            }    
        )
        return response.data;
    } catch (error) {
        console.error(`Error fetching live data for ${coin}: `, error.message);
        throw error;
    }
};

const getAssetImage = async (asset) => {
    try {
        // Fetch data for the specific asset
        const response = await axios.get(
            `${process.env.COIN_TRACKER_BASE_URL}/coins/markets?vs_currency=usd&ids=${asset.toLowerCase()}`,
            {
                headers: {
                    Accept: 'application/json',
                    'x-cg-demo-api-key': 'CG-7w2SPHTkWPCD1NWKQvDQCbvF'
                }
            }
        );

        // Ensure a valid response
        if (response.data && response.data.length > 0) {
            const assetData = response.data[0]; // Extract the first asset object
            return assetData.image; // Return the image URL
        } else {
            console.warn(`No image found for asset: ${asset}`);
            return null; // Return null if no data found
        }
    } catch (error) {
        console.error(`Error fetching image for ${asset}: `, error.message);
        throw error;
    }
};

const updateLiveCurrentMarketValue = async (asset) => {
    try {
        // Fetch the live price of the asset
        const livePriceData = await getLiveAssetPrice(asset.name.toLowerCase());
        

        if (!livePriceData || isNaN(livePriceData)) {
            console.warn(`Failed to fetch live price for ${asset.name}`);
            return asset; // Return asset without updating
        }

        // Ensure quantity and costBasis are valid numbers
        const quantity = asset.quantity || 0;
        const costBasis = asset.costBasis || 0;

        // Calculate current market value and P&L
        const updatedCurrentMarketValue = parseFloat((quantity * livePriceData).toFixed(2));
        const updatedPnL = parseFloat((updatedCurrentMarketValue - costBasis).toFixed(2));

        // Ensure valid values before saving
        if (isNaN(updatedCurrentMarketValue) || isNaN(updatedPnL)) {
            throw new Error(`Invalid calculation for ${asset.name}`);
        }

        // Update asset fields
        asset.currentMarketValue = updatedCurrentMarketValue;
        asset.pnl = updatedPnL;

        // Save the updated asset
        await asset.save();

        return asset; // Return the updated asset
    } catch (error) {
        console.error(`Error updating currentMarketValue and PnL for ${asset.name}:`, error.message);
        return asset; // Return asset without updates
    }
};


module.exports = { 
    getLiveAssetPrice, 
    getCompleteLiveAssetData, 
    getAssetImage, 
    updateLiveCurrentMarketValue,
};