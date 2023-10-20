// Contracts deployed on Mumbai Network

// TODO: VERY IMPORTANT - SWITCH BETWEEN TESTING and PROD
const TOKEN = 'USDT';
const USDC_ADDRESS = "0xa8811925bFC041160624E0Fdf5F0708F1400721D"; // Current USDT staging account (doesn't work with Prod)
const USDT_ADDRESS = "0x00eD5F324973cc430c154D23Ce4C6e3c215c5884"; // "0x86E3166f6B798E99ba7d03d95CB9Ef15957b468f"
const TRANSFER_CONTRACT_ADDRESS = "0x79124915B05AD838217ed5c5E1e90dAF656D4Ba7";
const CHAIN_ID = 80001;
const BICONOMY_KEY = "3gpnGKYpN.34ddf846-3d32-4af3-aec3-c0687f228ba2";
const MORALIS_KEY = "Hgy8UwB5FB7R8vsPc4GocfTq5iOrVsfjPuYWjGN11EkQqLbvxddPiyJakleGfrMH";
const CHAIN_NAME = "mumbai";
const COVALENT_KEY = "ckey_068f2d4768a141568514104dd6c";
const GAS_STATION_URL = 'https://gasstation-mumbai.matic.today/v2';
const DECIMALS_IN_USDT = 6;
const CMC_API_KEY = "0f62ca2b-aade-445e-85b3-2ab15aca2587";
const PROVIDER_URL = "https://polygon-mumbai.g.alchemy.com/v2/_gplt8bCNqPh_-2dExhmjeikzKBY-_cK";
const APPROVE_API_ID = "3160f8a6-c5a9-4104-86a0-3618ddcdb0c3"; // OLD: "7cf27a26-2e02-4ad8-a713-5f35630ab443";
const MUDREX_BASE_URL = "https://sandbox.mudrex.com/";
const TRANSFER_API_ID = "cdfa0a00-241b-474b-9b91-46db8e6beab9";
const SMART_TRANSFER_ADDRESS = "0x9578677E67B7b72884C9c0a6364C1BCcfCDD36D9";
const DAPP_WALLET_ADDRESS = "0x534e9B3EA1F77f687074685a5F7C8a568eF6D586";


// Contracts deployed on Polygon Network
// const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
// const TRANSFER_CONTRACT_ADDRESS = '';
// const CHAIN_ID = 137
// const BICONOMY_KEY = '<This should come from a .env file>';
// const GAS_STATION_URL = 'https://gasstation-mainnet.matic.network/v2';

const TOKEN_NAME = TOKEN === 'USDT' ? "(PoS) Tether USD" : "USD Coin (PoS)"; // "Tether USD"; // (On Prod: (PoS) Tether USD)
const TOKEN_VERSION = "1";

const SAFE_TRANSFER_NAME = "SafeTransfer";
const SMART_TRANSFER_NAME = "SmartTransfer";
const TRANSFER_VERSION = "1";

export {
  TOKEN,
  USDC_ADDRESS,
  USDT_ADDRESS,
  TRANSFER_CONTRACT_ADDRESS,
  CHAIN_ID,
  TOKEN_NAME,
  TOKEN_VERSION,
  SAFE_TRANSFER_NAME,
  TRANSFER_VERSION,
  BICONOMY_KEY,
  MORALIS_KEY,
  CHAIN_NAME,
  COVALENT_KEY,
  GAS_STATION_URL,
  SMART_TRANSFER_ADDRESS,
  SMART_TRANSFER_NAME,
  DECIMALS_IN_USDT,
  CMC_API_KEY,
  PROVIDER_URL,
  APPROVE_API_ID,
  TRANSFER_API_ID,
  MUDREX_BASE_URL,
  DAPP_WALLET_ADDRESS
};
