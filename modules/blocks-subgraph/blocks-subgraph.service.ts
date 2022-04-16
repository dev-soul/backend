import { GraphQLClient } from 'graphql-request';
import {
    Block_OrderBy,
    BlockFragment,
    BlocksQuery,
    BlocksQueryVariables,
    getSdk,
    OrderDirection,
} from './generated/blocks-subgraph-types';
import { env } from '../../app/env';
import {
    fiveMinutesInSeconds,
    getDailyTimestampsForDays,
    getDailyTimestampsWithBuffer,
    getHourlyTimestampsForDays,
    getHourlyTimestampsWithBuffer,
    twentyFourHoursInSecs,
} from '../util/time';
import { subgraphLoadAll } from '../util/subgraph-util';
import { cache } from '../cache/cache';
import moment from 'moment-timezone';

const DAILY_BLOCKS_CACHE_KEY = 'block-subgraph_daily-blocks';

export class BlocksSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        console.log("show blocks subgraph", env.BLOCKS_SUBGRAPH)
        this.client = new GraphQLClient(env.BLOCKS_SUBGRAPH);
    }

    //TODO: cache this
    public async getAverageBlockTime(): Promise<number> {
        const start = moment().startOf('hour').subtract(6, 'hours').unix();
        const end = moment().startOf('hour').unix();

        const blocks = (
            await this.sdk.Blocks({
                first: 1000,
                skip: 0,
                orderBy: Block_OrderBy.Number,
                orderDirection: OrderDirection.Desc,
                where: { timestamp_gt: `${start}`, timestamp_lt: `${end}` },
            })
        ).blocks;

        if (blocks.length === 0) {
            console.error('Unable to retrieve the blocks, returning a default value of 1.5 seconds per block');
            return 1.5;
        }

        let timestamp: null | number = null;
        let averageBlockTime = 0;

        for (const block of blocks) {
            if (timestamp !== null) {
                const difference = timestamp - parseInt(block.timestamp);

                averageBlockTime = averageBlockTime + difference;
            }

            timestamp = parseInt(block.timestamp);
        }

        return averageBlockTime / blocks.length;
    }

    public async getBlocks(args: BlocksQueryVariables): Promise<BlocksQuery> {
        return this.sdk.Blocks(args);
    }

    public async getAllBlocks(args: BlocksQueryVariables): Promise<BlockFragment[]> {
        return subgraphLoadAll<BlockFragment>(this.sdk.Blocks, 'blocks', args);
    }

    /*public async getHourlyBlocks(numDays: number): Promise<BlockFragment[]> {
        const timestampsWithBuffer = getHourlyTimestampsWithBuffer(numDays);
        const timestamps = getHourlyTimestampsForDays(numDays);
        const blocks: BlockFragment[] = [];

        const allBlocks = await this.getAllBlocks({
            orderDirection: OrderDirection.Desc,
            orderBy: Block_OrderBy.Timestamp,
            where: {
                timestamp_in: timestampsWithBuffer.map((timestamp) => `${timestamp}`),
            },
        });

        for (const timestamp of timestamps) {
            const closest = allBlocks.reduce((a, b) => {
                return Math.abs(parseInt(b.timestamp) - timestamp) < Math.abs(parseInt(a.timestamp) - timestamp)
                    ? b
                    : a;
            });

            //filter out any matches that are further than 5 minutes away.e
            if (Math.abs(timestamp - parseInt(closest.timestamp)) < fiveMinutesInSeconds) {
                blocks.push({ ...closest, timestamp: `${timestamp}` });
            }
        }

        return blocks;
    }*/

    public async getBlockFrom24HoursAgo(): Promise<BlockFragment> {
        const args = {
            orderDirection: OrderDirection.Desc,
            orderBy: Block_OrderBy.Timestamp,
            where: {
                timestamp_in: [
                    `${moment.tz('GMT').subtract(1, 'day').subtract(3, 'seconds').unix()}`,
                    `${moment.tz('GMT').subtract(1, 'day').subtract(2, 'seconds').unix()}`,
                    `${moment.tz('GMT').subtract(1, 'day').subtract(1, 'second').unix()}`,
                    `${moment.tz('GMT').subtract(1, 'day').unix()}`,
                    `${moment.tz('GMT').subtract(1, 'day').add(1, 'second').unix()}`,
                    `${moment.tz('GMT').subtract(1, 'day').add(2, 'seconds').unix()}`,
                    `${moment.tz('GMT').subtract(1, 'day').add(3, 'seconds').unix()}`,
                ],
            },
        };

        const allBlocks = await this.getAllBlocks(args);

        return allBlocks[0];
    }

    public async getDailyBlocks(numDays: number): Promise<BlockFragment[]> {
        const maxDays = moment.tz('GMT').diff(moment.tz(env.SUBGRAPH_START_DATE, 'GMT'), 'days');
        numDays = maxDays < numDays ? maxDays : numDays;

        const timestampsWithBuffer = getDailyTimestampsWithBuffer(numDays);

        const timestamps = getDailyTimestampsForDays(numDays);
        const blocks: BlockFragment[] = [];
        const args = {
            orderDirection: OrderDirection.Desc,
            orderBy: Block_OrderBy.Timestamp,
            where: {
                timestamp_in: timestampsWithBuffer.map((timestamp) => `${timestamp}`),
            },
        };

        const cacheResult = await cache.getValueKeyedOnObject(DAILY_BLOCKS_CACHE_KEY, args);

        if (cacheResult) {
            return JSON.parse(cacheResult);
        }

        const allBlocks = await this.getAllBlocks(args);

        for (const timestamp of timestamps) {
            const closest = allBlocks.reduce((a, b) => {
                return Math.abs(parseInt(b.timestamp) - timestamp) < Math.abs(parseInt(a.timestamp) - timestamp)
                    ? b
                    : a;
            });

            //filter out any matches that are further than 5 minutes away.e
            if (Math.abs(timestamp - parseInt(closest.timestamp)) < fiveMinutesInSeconds) {
                blocks.push({ ...closest, timestamp: `${timestamp}` });
            }
        }

        await cache.putValueKeyedOnObject(DAILY_BLOCKS_CACHE_KEY, args, JSON.stringify(blocks), twentyFourHoursInSecs);

        return blocks;
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const blocksSubgraphService = new BlocksSubgraphService();
