# Crypto Portfolio Tracker

## Overview
The Crypto Portfolio Tracker is a Node.js and Express-based application that allows users to track their cryptocurrency portfolios. The application provides features such as manual trade entry, real-time price updates, portfolio market value calculations, and profit-and-loss (PnL) tracking.

## Features
- **User Authentication**: Secure login and registration using JWT-based authentication.
- **Portfolio Management**: Users can:
  - Add assets and trades manually.
  - View their current portfolio, including assets, quantities, and current market values.
  - Calculate and display portfolio market value and cost basis.
- **Trade Management**:
  - Add, update, and delete trades for specific assets.
  - Automatically updates asset quantities, cost basis, and PnL.
- **Real-Time Price Updates**:
  - Fetch live prices for cryptocurrencies using the CoinGecko API.
  - Automatically updates the portfolio’s market value and PnL whenever data is retrieved.
- **RESTful API**:
  - Exposes endpoints for all portfolio, asset, and trade operations.

## Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **External API**: CoinGecko API for real-time price data

## API Endpoints

### Authentication
- **POST /register**: Register a new user.
- **POST /auth**: Log in and receive an access token.
- **POST /refresh**: Refresh access tokens.
- **POST /logout**: Log out and invalidate the refresh token.

### Portfolio
- **GET /portfolio/:userId**: Retrieve the user's portfolio, including current market value and cost basis.

### Assets
- **GET /asset/:userId/:assetId**: Retrieve detailed information about a specific asset.
- **DELETE /asset/:userId/:assetId**: Remove an asset from the portfolio (if all trades are deleted).

### Trades
- **POST /trade/:userId**: Add a trade to an existing or new asset.
- **PUT /trade/:userId/:assetId/:tradeId**: Update an existing trade.
- **DELETE /trade/:userId/:assetId/:tradeId**: Delete a trade and update asset information accordingly.

## Models

### User
```javascript
{
  username: String,
  password: String,
  firstname: String,
  lastname: String,
  roles: {
    User: Number,
    Admin: Number
  },
  portfolio: [ObjectId], // References to Asset
  refreshToken: [String]
}
```

### Asset
```javascript
{
  user: ObjectId, // Reference to User
  name: String,
  image: String,
  quantity: Number,
  costBasis: Number,
  currentMarketValue: Number,
  pnl: Number,
  trades: [TradeSchema]
}
```

### Trade
```javascript
{
  amount: Number,
  price: Number,
  total: Number,
  timestamp: Date,
  type: String // 'buy' or 'sell'
}
```

## Installation and Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository_url>
   cd crypto-portfolio-tracker
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory with the following keys:
   ```env
   PORT=5000
   MONGO_URI=<your_mongodb_connection_string>
   ACCESS_TOKEN_SECRET=<your_access_token_secret>
   REFRESH_TOKEN_SECRET=<your_refresh_token_secret>
   COIN_TRACKER_BASE_URL=https://api.coingecko.com/api/v3
   COIN_TRACKER_API_KEY=<your_coin_gecko_api_key>
   ```

4. **Start the Server**:
   ```bash
   npm start
   ```

5. **API Testing**:
   Use tools like Postman or cURL to test the API endpoints.

## Future Enhancements
- **Frontend Integration**: Build a React or Vue.js frontend to interact with the API.
- **Advanced Analytics**: Add features for historical data analysis and advanced portfolio insights.
- **Automated Syncing**: Integrate with exchanges to automatically sync trades and balances.
- **Notifications**: Add email or SMS notifications for significant portfolio changes.

## Credits
- **API**: [CoinGecko](https://www.coingecko.com/en/api) for cryptocurrency price data.
- **Icons**: Asset icons provided by CoinGecko.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
