import { Resolvers } from '../../schema';
import { portfolioService } from './portfolio.service';
import { getRequiredAccountAddress, isAdminRoute } from '../util/resolver-util';
import { balancerService } from '../balancer-subgraph/balancer.service';
import { masterchefService } from '../masterchef-subgraph/masterchef.service';
//import { embrPitService } from '../embr-pit-subgraph/embr-pit.service';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';

const resolvers: Resolvers = {
    Query: {
        portfolioGetUserPortfolio: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            //console.log(JSON.stringify(await portfolioService.getPortfolio(accountAddress), null, 4));

            const portfolioData = await portfolioService.getPortfolio(accountAddress);

            return portfolioService.mapPortfolioDataToGql(portfolioData);
        },
        portfolioGetUserPortfolioHistory: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            const portfolioHistoryData = await portfolioService.getPortfolioHistory(accountAddress);

            return portfolioHistoryData.map((data) => portfolioService.mapPortfolioDataToGql(data));
        },
        getCachedPools: async (parent, {}, context) => {
            return portfolioService.getCachedPools();
        },
    },
    //we're forced to have at least one mutation
    Mutation: {
        emptyMutation: async () => true,
        clearCacheAtBlock: async (parent, { block }, context) => {
            isAdminRoute(context);

            await balancerService.clearCacheAtBlock(block);
            await masterchefService.clearCacheAtBlock(block);
            //await embrPitService.clearCacheAtBlock(block);

            return true;
        },
        clearCachedPools: async (parent, {}, context) => {
            isAdminRoute(context);

            const blocks = await blocksSubgraphService.getDailyBlocks(30);

            for (const block of blocks) {
                await balancerService.clearPoolsAtBlock(parseInt(block.number));
            }

            return true;
        },
    },
};

export default resolvers;
