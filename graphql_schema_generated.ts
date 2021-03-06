import { gql } from 'apollo-server-express';
export const schema = gql`
    #
    # THIS FILE IS AUTOGENERATED — DO NOT EDIT IT
    #

    scalar Binary

    scalar Date

    scalar Datetime

    type GqlBalancerPool {
        address: String!
        block: String!
        holdersCount: String!
        id: String!
        name: String
        swapFee: String!
        swapsCount: String!
        symbol: String
        timestamp: String!
        totalLiquidity: String!
        totalShares: String!
        totalSwapFee: String!
    }

    scalar GqlBigNumber

    type GqlHistoricalTokenPrice {
        address: String!
        prices: [GqlHistoricalTokenPriceEntry!]!
    }

    type GqlHistoricalTokenPriceEntry {
        price: Float!
        timestamp: String!
    }

    type GqlTokenPrice {
        address: String!
        price: Float!
    }

    type GqlUserPoolData {
        id: String!
        myFees: GqlBigNumber!
        name: String!
        percentOfPortfolio: Float!
        percentShare: Float!
        poolAddress: String!
        poolId: String!
        priceChange: GqlBigNumber!
        priceChangePercent: Float!
        pricePerShare: GqlBigNumber!
        shares: GqlBigNumber!
        swapFees: GqlBigNumber!
        swapVolume: GqlBigNumber!
        tokens: [GqlUserTokenData!]!
        totalValue: GqlBigNumber!
    }

    type GqlUserPortfolioData {
        myFees: GqlBigNumber!
        pools: [GqlUserPoolData!]!
        timestamp: Int!
        tokens: [GqlUserTokenData!]!
        totalSwapFees: GqlBigNumber!
        totalSwapVolume: GqlBigNumber!
        totalValue: GqlBigNumber!
    }

    type GqlUserTokenData {
        address: String!
        balance: GqlBigNumber!
        id: String!
        name: String!
        percentOfPortfolio: Float!
        pricePerToken: GqlBigNumber!
        symbol: String!
        totalValue: GqlBigNumber!
    }

    scalar JSON

    type Mutation {
        clearCacheAtBlock(block: Int!): Boolean!
        clearCachedPools: Boolean!
        emptyMutation: Boolean!
        reloadTokenPrices: Boolean
    }

    type Query {
        getCachedPools: [GqlBalancerPool!]!
        portfolioGetUserPortfolio: GqlUserPortfolioData!
        portfolioGetUserPortfolioHistory: [GqlUserPortfolioData!]!
        tokenPriceGetCurrentPrices: [GqlTokenPrice!]!
        tokenPriceGetHistoricalPrices(addresses: [String!]!): [GqlHistoricalTokenPrice!]!
    }

    type TranslatedString {
        de: String!
        en: String!
    }

    scalar UUID
`;
