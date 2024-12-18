const User = require('../model/User');
const Asset = require('../model/Asset');
const { getLiveAssetPrice, updateLiveCurrentMarketValue, getAssetImage } = require(`../utils/cryptoPrices`);

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { firstname, lastname, roles } = req.body;

  try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      if (firstname) user.firstname = firstname;
      if (lastname) user.lastname = lastname;
      if (roles) user.roles = roles;

      await user.save();
      res.status(200).json({ message: `User ${user.username}, updated successfully` });
  } catch (error) {
      console.error('Error updating user: ', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
};

const getPortfolio = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate(
      {
        path: 'portfolio',
        select: '_id user name image quantity costBasis currentMarketValue'
      }
    ).exec();

    if (!user) return res.status(404).json({ error: 'User not found.' });

    let totalMarketValue = 0;
    let totalCostBasis = 0;

    const updatedPortfolio = await Promise.all(
      user.portfolio.map(async (asset) => {
        const updatedAsset = await updateLiveCurrentMarketValue(asset);

        // Accumulate the market value for portfolio total
        console.log(`current market value: ${updatedAsset.currentMarketValue}`);
        totalMarketValue += updatedAsset.currentMarketValue || 0;
        console.log(`cost basis: ${asset.costBasis}`);
        totalCostBasis += updatedAsset.costBasis || 0;

        return updatedAsset;
      })
    );

    // Update the user's portfolioMarketValue with the calculated total
    user.portfolioMarketValue = parseFloat(totalMarketValue.toFixed(2));
    user.portfolioCostBasis = parseFloat(totalCostBasis.toFixed(2));

    await user.save();

    res.status(200).json({ portfolio: updatedPortfolio, portfolioMarketValue: totalMarketValue, portfolioCostBasis: totalCostBasis});
  } catch (error) {
    console.error('Error retrieving portfolio: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const addTrade = async (req, res) => {
  const { userId } = req.params; 
  const { name, amount, price, timestamp, type } = req.body;

  try {
    let asset = await Asset.findOne({ user: userId, name });

    if (asset) {
      // Add trade and update existing asset
      const trade = { amount, price, total: amount * price, timestamp, type };
      asset.trades.push(trade);

      if (type === 'buy') {
        asset.quantity += amount;
        asset.costBasis += amount * price;
        asset.averagePrice = asset.costBasis / asset.quantity;
      } else if (type === 'sell') {
        if (asset.quantity < amount) {
          return res.status(400).json({ error: 'Insufficient quantity to sell' });
        }
        asset.costBasis -= (amount / asset.quantity) * asset.costBasis;
        asset.quantity -= amount;
        asset.averagePrice = asset.costBasis / asset.quantity || 0; 
      }

      const livePriceData = await getLiveAssetPrice(name.toLowerCase());

      asset.currentMarketValue = parseFloat((asset.quantity * livePriceData).toFixed(2));
      asset.pnl = parseFloat((asset.currentMarketValue - asset.costBasis).toFixed(2));

      await asset.save();

      return res.status(200).json({ message: 'Trade added successfully', asset });
    } else {
      // Asset does not exist: create new asset
      if (type == 'sell') {
        return res.status(400).json({ message: 'Cannot create an asset with a sell trade' });
      }

      const trade = { amount, price, total: amount * price, timestamp, type };
      const livePriceData = await getLiveAssetPrice(name.toLowerCase());
      const assetImage = await getAssetImage(name.toLowerCase());

      const newAsset = new Asset({
        user: userId,
        name,
        image: assetImage,
        quantity: amount,
        costBasis: amount * price,
        currentMarketValue: parseFloat((amount * livePriceData).toFixed(2)),
        pnl: parseFloat((amount * livePriceData - amount * price).toFixed(2)),
        trades: [trade],
        averagePrice: price,
      });

      await newAsset.save();

      const user = await User.findById(userId);
      user.portfolio.push(newAsset);
      await user.save();

      return res.status(201).json({ message: `${newAsset.name} was added to portfolio`, asset: newAsset });
    }
  } catch (error) {
    console.error('Error adding trade and asset: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateTrade = async (req, res) => {
  const { userId, assetId, tradeId } = req.params;
  const { amount , price, timestamp, type } = req.body;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset || asset.user.toString() !== userId) {
      res.status(400).json({ message: 'Asset not found or unauthorized' });
    }

    const tradeIndex = asset.trades.findIndex(trade => trade._id.toString() === tradeId);
    if (tradeIndex === -1) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    const oldTrade = asset.trades[tradeIndex];
    if (oldTrade.type === 'buy') {
        asset.quantity -= oldTrade.amount;
        asset.costBasis -= oldTrade.amount * oldTrade.price;
    } else if (oldTrade.type === 'sell') {
        asset.quantity += oldTrade.amount;
    }

    // Update the trade
    asset.trades[tradeIndex] = {
        _id: tradeId,
        amount,
        price,
        total: parseInt((amount * price).toFixed(2)),
        timestamp,
        type
    };

    // Recalculate asset fields with updated trade
    if (type === 'buy') {
        asset.quantity += amount;
        asset.costBasis += amount * price;
    } else if (type === 'sell') {
        asset.quantity -= amount;
    }

    // Update currentMarketValue and pnl
    await updateLiveCurrentMarketValue(asset);

    res.status(200).json({ message: 'Trade updated successfully', asset });
  } catch (error) {
    console.error('Error updating trade:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteTrade = async (req, res) => {
  const { userId, assetId, tradeId } = req.params;

  try {
    // Find the asset and ensure it belongs to the user
    const asset = await Asset.findById(assetId);
    if (!asset || asset.user.toString() !== userId) {
      return res.status(404).json({ message: 'Asset not found or unauthorized' });
    }

    // Find the trade to delete
    const trade = asset.trades.id(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    // Remove the trade's effect on asset fields
    if (trade.type === 'buy') {
      asset.quantity -= trade.amount;
      asset.costBasis -= trade.amount * trade.price;
    } else if (trade.type === 'sell') {
      asset.quantity += trade.amount;
    }

    // Remove the trade from the trades array using pull()
    asset.trades.pull(tradeId);

    if (asset.trades.length === 0) {
      await Asset.findByIdAndDelete(assetId);
      return res.status(200).json({ message: 'All trades deleted, asset removed successfully' });
    }

    // Update currentMarketValue and pnl
    await updateLiveCurrentMarketValue(asset);

    // Save the updated asset
    await asset.save();

    res.status(200).json({ message: 'Trade deleted successfully', trade });
  } catch (error) {
    console.error('Error deleting trade:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const deleteAsset = async (req, res) => {
  const { userId, assetId } = req.params;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found'});

    if (asset.user.toString() !== userId) {
      return res.status(403).json({ message: 'Forbiddne: You do not own this asset' });
    }

    const user = await User.findById(userId);
    if (user) {
      user.portfolio = user.portfolio.filter(id => id.toString() !== assetId);
      await user.save();
    }

    const assetName = asset.name;
    await Asset.findByIdAndDelete(assetId);

    res.status(200).json({ message: `Asset ${assetName}, deleted successfully` });
  } catch (error) {
    console.error('Error deleting asset: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAssetData = async (req, res) => {
  const { userId, assetId } = req.params;

  try {
    const asset = await Asset.findById(assetId).exec();

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.user.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this asset' })
    }

    const updatedAsset = await updateLiveCurrentMarketValue(asset);

    res.status(200).json(updatedAsset);
  } catch (error) {
    console.error('Error retrieving asset: ', error.messsage);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { updateUser, getPortfolio, addTrade, updateTrade, deleteTrade, deleteAsset, getAssetData };