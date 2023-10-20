import axios from "axios";
import { ethers } from "ethers";
import { MUDREX_BASE_URL } from "./ethereum/config";
import { SMART_TRANSFER_ABI } from "./ethereum/abis";
import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto-browserify';

const user_id = '3d3491b4-800b-45b6-abcc-afbb9ce4b137';

export const getGasPrice = async (txnPrice = 'standard', gasStationUrl) => {
    console.log(`Fetching gas price from ${gasStationUrl}`);
    const { data } = await axios.get(gasStationUrl);
    const maxFeePerGas = Math.ceil(data[txnPrice].maxFee) * 10 ** 9;
    const maxPriorityFeePerGas = Math.ceil(data[txnPrice].maxPriorityFee) * 10 ** 9;
    return { maxFeePerGas, maxPriorityFeePerGas };
};
  
export const tokenPriceViaCMC = async (token, currency, cmcApiKey) => {
    const headers = {
        'Content-Type': 'application/json',
        'X-CMC_PRO_API_KEY': cmcApiKey
    };
    const tokenPriceUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${token}&convert=${currency}`;
    const response = await axios.get(tokenPriceUrl, { headers });
    const data = response.data;
    const price = data.data[token][0].quote[currency].price;
    console.log(`The price of ${token} is ${price} ${currency}`);
    return price;
};

export const tokenPrice = async (token, currency) => {
  const convertPriceEndpoint = `${MUDREX_BASE_URL}api/v1/wallet/conversion/crypto/price/${token}`;
  // const options = this.createOptionsConfig(user_id);
  const options = createOptionsConfig(user_id);
  const { data } = await axios.get(
      convertPriceEndpoint,
      options
  );
  console.log("Data: ", data.data);
  const price = data.data[currency].price;
  console.log(`The price of ${token} is ${price} ${currency}`);
  return price;
};

export const getMetaTransferEstimate = async (signer, smartTransferAddress, params) => {
    try {
      const smartTransfer = new ethers.Contract(smartTransferAddress, SMART_TRANSFER_ABI, signer);
      const metaTransferGasLimit = await smartTransfer.estimateGas.metaTransfer(...params);
      console.log("Gas estimate for metaTransfer:", metaTransferGasLimit.toString());
      return metaTransferGasLimit.toString();
    } catch (error) {
      console.log("getGasFee: ", error);
    }
  }

const createOptionsConfig = async () => {
  console.log("OFFRAMP_CLIENT_ID: ", process.env.REACT_APP_OFFRAMP_CLIENT_ID);
    const timeInSeconds = Math.floor(Date.now() / 1000);
    const requestId = uuidv4();
    const sigString = requestId + timeInSeconds + user_id;
    const secretKey = createHmac('sha256', process.env.REACT_APP_OFFRAMP_SECRET_KEY)
        .update(sigString)
        .digest()
        .toString('hex')
        .toUpperCase();

    const headers = {
              'X-Timestamp': timeInSeconds,
              'X-Client-Id': process.env.REACT_APP_OFFRAMP_CLIENT_ID,
              'X-User-Id': user_id,
              'X-Secret-Key': secretKey,
              'X-Request-Id': requestId,
          };
    const options = {
        headers,
    };
    return options;
}