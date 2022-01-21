// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { z } from 'zod';

const coinMarketCapApiSchema = z.string();
export const coinMarketCapApi = coinMarketCapApiSchema.parse(process.env.COINMARKETCAP_API);

const alchemyMainnetKeySchema = z.string();
export const alchemyMainnetKey = alchemyMainnetKeySchema.parse(process.env.ALCHEMY_MAINNET_API_KEY);

const alchemyRinkebyKeySchema = z.string();
export const alchemyRinkebyKey = alchemyRinkebyKeySchema.parse(process.env.ALCHEMY_RINKEBY_API_KEY);

const infuraPalmKeySchema = z.string();
export const infuraPalmKey = infuraPalmKeySchema.parse(process.env.PALM_API_KEY);
