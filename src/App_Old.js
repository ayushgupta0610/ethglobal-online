// import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";
import { Button, Input } from "semantic-ui-react";
import { ethers, BigNumber } from "ethers";
import { TOKEN_ABI, TRANSFER_ABI, TOKEN_PROD_ABI, SMART_TRANSFER_ABI } from "./ethereum/abis";
import {
  signMessage,
  getTransferMessage,
  getSmartTransferMessage,
  getPermitMessage,
  getMaticMetaTransactionMessage,
} from "./ethereum/eip712";
import { Biconomy } from "@biconomy/mexa";
import {
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
  DECIMALS_IN_USDT,
  SMART_TRANSFER_NAME,
  PROVIDER_URL,
  APPROVE_API_ID,
  TRANSFER_API_ID,
  DAPP_WALLET_ADDRESS
} from "./ethereum/config";
import { tokenPrice, getGasPrice, getMetaTransferEstimate } from "./tokenPrice";
import axios from "axios";

const tokenABIInterface = new ethers.utils.Interface(TOKEN_PROD_ABI);
const transferABIInterface = new ethers.utils.Interface(TRANSFER_ABI);

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [signer, setSigner] = useState();
  const [loading, setLoading] = useState(false);
  const [inputAddress, setInputValue] = useState("");
  const [biconomy, setBiconomy] = useState(null);
  const [ercForwarderClient, setErcForwarderClient] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    // Update the document title using the browser API
    // window.ethereum?.on("accountsChanged", connectWallet);
  });

  async function connectWallet() {
    try {
      setLoading(true);
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("Account: ", accounts[0]);
        setWalletAddress(accounts[0]);
        await setWalletSigner();
        if (biconomy === undefined || biconomy === null) {
          await initiateBiconomy();
        }
      } else {
        console.log("Web3 wallet not found.");
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  async function setWalletSigner() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const urlJsonRpcProvider = new ethers.providers.InfuraProvider("matic", "00b1a853d56e47a8822e1124927039fa"); // Matic Mainnet
      // const urlJsonRpcProvider = new ethers.providers.InfuraProvider("maticmum", "00b1a853d56e47a8822e1124927039fa"); // Matic Mumbai
      // const walletSigner = new ethers.Wallet(privateKey, urlJsonRpcProvider); // On mobile for web3Auth wallet creation
      const walletSigner = provider.getSigner();
      console.log("Signer address: ", await walletSigner.getAddress());
      setSigner(walletSigner);
    } catch (error) {
      console.error(error);
    }
  }

  async function initiateBiconomy() {
    try {
      const biconomyInstance = new Biconomy(window.ethereum, {
        apiKey: BICONOMY_KEY,
        contractAddresses: [USDC_ADDRESS, USDT_ADDRESS, TRANSFER_CONTRACT_ADDRESS, SMART_TRANSFER_ADDRESS],
        debug: false,
        strictMode: true,
      });
      await biconomyInstance.init();
      console.log("Biconomy instance: ", biconomyInstance);
      console.log("Biconomy erc20ForwarderClient: ", biconomyInstance.erc20ForwarderClient);
        // biconomyInstance.onEvent(biconomyInstance.READY, () => {
        //   // Initialize your dapp here like getting user accounts etc
        //   console.log("Biconomy is ready to use.", biconomyInstance.erc20ForwarderClient);
        //   setErcForwarderClient(biconomyInstance.erc20ForwarderClient);
        // }).onEvent(biconomyInstance.ERROR, (error, message) => {
        //   // Handle error while initializing mexa
        //   console.log("Biconomy failed to be initialised.");
        // });
      setBiconomy(biconomyInstance);
      setErcForwarderClient(biconomyInstance.erc20ForwarderClient);
    } catch (error) {
      console.error(error);
    }
  }

  function getContractInstance(contract = "transfer", token = TOKEN) {
    let contractInstance;
    if (contract === "transfer") {
      contractInstance = new ethers.Contract(
        TRANSFER_CONTRACT_ADDRESS,
        TRANSFER_ABI,
        biconomy.signer
      );
    } else if (contract === "smartTransfer") {
        contractInstance = new ethers.Contract(SMART_TRANSFER_ADDRESS, SMART_TRANSFER_ABI, biconomy.signer);
    } else if (contract === "token") {
      contractInstance = new ethers.Contract(
        token === "USDT" ? USDT_ADDRESS : USDC_ADDRESS,
        token === "USDT" ? TOKEN_PROD_ABI : TOKEN_ABI,
        biconomy.signer
      );
    } 
    console.log("Contract instance: ", contractInstance);
    return contractInstance;
  }

  async function estimateGas() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const approveTxn = await approve();
      const transferTxn = await transfer();
      const gasPrice = await provider.getGasPrice();
      const approveGasEstimate = await provider.estimateGas(approveTxn);
      const transferGasEstimate = await provider.estimateGas(transferTxn);
      console.log("Gas price: ", gasPrice);
      console.log("Approve gas estimate: ", approveGasEstimate);
      console.log("Transfer gas estimate: ", transferGasEstimate);
    } catch (error) {
      console.error(error);
    }
  }

  async function transfer() {
    const usdtAmount = ethers.utils.parseUnits("1", 6);
    // Initiating wallet via private key
    const privateKey = "";
    // PROVIDER_NAME for testnet = "maticmum" and INFURA_KEY="00b1a853d56e47a8822e1124927039fa"
    const urlJsonRpcProvider = new ethers.providers.InfuraProvider(
      "maticmum",
      "00b1a853d56e47a8822e1124927039fa"
    ); // Matic Mumbai
    const walletSigner = new ethers.Wallet(privateKey, urlJsonRpcProvider); // On mobile for web3Auth wallet creation
    const tokenContract = new ethers.Contract(
      USDC_ADDRESS,
      TOKEN_ABI,
      walletSigner
    );
    const { data } = await axios.get(GAS_STATION_URL);
    const maxFeePerGas = Math.ceil(data.standard.maxFee) * 10 ** 9;
    const maxPriorityFeePerGas = Math.ceil(data.standard.maxPriorityFee) * 10 ** 9;
    const txnResponse = await tokenContract.transfer(inputAddress, usdtAmount, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    console.log(
      `Txn ${txnResponse.hash} initiated with starttime: ${new Date()}`
    );
    const txn = await txnResponse.wait(1);
    console.log(
      `Txn ${txn.transactionHash} confirmed with starttime: ${new Date()}`
    );
    return txn.transactionHash;
  }

  async function balanceViaMoralis() {
    try {
      const startTime = new Date();
      console.log("Start time on Moralis: ", startTime);
      const tokenAddress = TOKEN === "USDT" ? USDT_ADDRESS : USDC_ADDRESS;
      const balanceEndpoint = `https://deep-index.moralis.io/api/v2/${walletAddress}/erc20?chain=${CHAIN_NAME}&token_addresses%5B0%5D=${tokenAddress}`;
      const { data } = await axios.get(balanceEndpoint, {
        headers: { "X-API-Key": MORALIS_KEY, accept: "application/json" },
      });
      console.log("Time taken via Moralis: ", new Date() - startTime);
      console.log(data);
      return data?.result ? data.result[0].balance : "0";
    } catch (error) {
      // @ts-ignore
      return error.response.data;
    }
  }

  async function balanceViaCovalent() {
    try {
      const startTime = new Date();
      console.log("Start time on Covalent: ", startTime);
      const balanceEndpoint = `https://api.covalenthq.com/v1/${CHAIN_ID}/address/${walletAddress}/balances_v2/?key=${COVALENT_KEY}`;
      const { data } = await axios.get(balanceEndpoint, {
        headers: { "X-API-Key": MORALIS_KEY, accept: "application/json" },
      });
      console.log("Time taken via Covalent: ", new Date() - startTime);
      console.log(data.items[2]);
      return data.items[2];
    } catch (error) {
      // @ts-ignore
      return error.response.data;
    }
  }

  async function approveApiApproach() {
    try {
      setApprovalLoading(true);
      const contract = getContractInstance("token", "USDT");
      const value = ethers.constants.MaxUint256; // Amount of USDT to be approved
      // TODO: VERY IMPORTANT - USE BELOW FOR TESTING
      // const deadline = 1704067199; // 31st Dec'23
      // const nonce = await contract.nonces(walletAddress); // Nonce of the user in the contract (on Polygon - instead of nonces it would be getNonce)
      // const domain = {
      //   name: TOKEN_NAME,
      //   version: TOKEN_VERSION,
      //   chainId: CHAIN_ID,
      //   verifyingContract: USDC_ADDRESS,
      // };
      // const message = {
      //   owner: walletAddress,
      //   spender: SMART_TRANSFER_ADDRESS,
      //   value,
      //   nonce,
      //   deadline,
      // };
      // const typedData = await getPermitMessage(message, domain);
      // const { r, s, v } = await signMessage(signer, typedData);
      // const params = [
      //   walletAddress,
      //   SMART_TRANSFER_ADDRESS,
      //   value,
      //   deadline,
      //   v,
      //   r,
      //   s,
      // ];
      // const approveApiId = "f5a0e393-4aff-4333-96e9-f11f6adfa78e";
      // TODO: VERY IMPORTANT - USE BELOW FOR PROD
      const nonce = await contract.getNonce(walletAddress); // Nonce of the user in the contract (on Polygon - instead of nonces it would be getNonce)
      const bytes32ChainId = ethers.utils.hexZeroPad(
        ethers.utils.hexlify(CHAIN_ID),
        32
      );
      const functionSignature = tokenABIInterface.encodeFunctionData(
        "approve",
        [SMART_TRANSFER_ADDRESS, value]
      );
      const domain = {
        name: TOKEN_NAME,
        version: TOKEN_VERSION,
        verifyingContract: USDT_ADDRESS,
        salt: bytes32ChainId,
      };
      const message = {
        nonce,
        from: walletAddress,
        functionSignature,
      };
      const typedData = await getMaticMetaTransactionMessage(message, domain);
      const { r, s, v } = await signMessage(signer, typedData);
      // These are the params you need to send to the api
      const params = [walletAddress, functionSignature, r, s, v];
      console.log("approve api: ", params);
      const gaslessTxn = await gaslessApiFunction(params, APPROVE_API_ID, USDT_ADDRESS);
      console.log("Gasless approve txn: ", gaslessTxn);
    } catch (error) {
      console.error(error);
    }
    setApprovalLoading(false);
  }

  async function approve() {
    try {
      setApprovalLoading(true);
      const contract = getContractInstance("token", "USDC");
      // TODO: Change these to dynamic values
      const value = ethers.constants.MaxUint256; // Amount of USDT/INDI to be approved
      const deadline = 1704067199; // 31st Dec'23
      const nonce = await contract.nonces(walletAddress); // Nonce of the user in the USDC contract (on Polygon - instead of nonces it would be getNonce)
      const domain = {
        name: TOKEN_NAME,
        version: TOKEN_VERSION,
        chainId: CHAIN_ID,
        verifyingContract: USDC_ADDRESS,
      };
      const message = {
        owner: walletAddress,
        spender: SMART_TRANSFER_ADDRESS,
        value,
        nonce,
        deadline,
      };
      const typedData = await getPermitMessage(message, domain);
      const { r, s, v } = await signMessage(signer, typedData);
      const { data } = await contract.populateTransaction.permit(
        walletAddress,
        SMART_TRANSFER_ADDRESS,
        value,
        deadline,
        v,
        r,
        s
      );
      const txParams = {
        data: data,
        to: USDC_ADDRESS,
        from: walletAddress,
        signatureType: "EIP712_SIGN",
      };
      biconomy.on("txMined", (txn) => { 
        console.log("Mined txnHash: ", txn.hash);
      });
      await biconomy.provider.send("eth_sendTransaction", [txParams]);
    } catch (error) {
      console.error(error);
    }
    setApprovalLoading(false);
  }

  async function gaslessApiFunction(params, apiId, to = SMART_TRANSFER_ADDRESS) {
    try {
      const biconomyEndpoint = "https://api.biconomy.io/api/v2/meta-tx/native";
      const headers = {
        "x-api-key": BICONOMY_KEY,
        "Content-Type": "application/json",
      };
      const { data } = await axios.post(
        biconomyEndpoint,
        { from: walletAddress, params, apiId, to },
        { headers }
      );
      return data;
      /*
        {
          "code": 200,
          "message": "Meta transaction sent to blockchain",
          "txHash": "0x8cf8b8ede63d7db1772fafba51ffbbc8cc9f5dfd0686054e3858b3cbece1ef2b",
          "flag": 200,
          "log": "Meta transaction sent to blockchain",
          "retryDuration": 137
        }
      */
    } catch (error) {
      console.log("gaslessApiFunction: ", error.response.data);
      /** 
        code: 417
        flag: 417
        log: "Error while gas estimation with message cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (reason=\"execution reverted: ERC20Permit: invalid signature\", method=\"estimateGas\", transaction={\"from\":\"0xAC70bFe5C17C82F00492beb552170cdbF2Dae837\",\"to\":\"0x763318cf46Ec0B0EeA9934d076247A538670CC0f\",\"data\":\"0xd505accf0000000000000000000000003b3b48f595e610c1568e72ff3e7c832e4eab5c5d00000000000000000000000079124915b05ad838217ed5c5e1e90daf656d4ba7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000006592007f000000000000000000000000000000000000000000000000000000000000001bf6f4c136e637a6d7962a0c12c84307d213c0cda39d1971077d3109b19a9eaba27f636c40167a37fb10ec493b733a9c9f5c79732d27568bb90d61018b3bae737d\",\"accessList\":null}, error={\"reason\":\"processing response error\",\"code\":\"SERVER_ERROR\",\"body\":\"{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"id\\\":36894,\\\"error\\\":{\\\"code\\\":3,\\\"message\\\":\\\"execution reverted: ERC20Permit: invalid signature\\\",\\\"data\\\":\\\"0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001e45524332305065726d69743a20696e76616c6964207369676e61747572650000\\\"}}\",\"error\":{\"code\":3,\"data\":\"0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001e45524332305065726d69743a20696e76616c6964207369676e61747572650000\"},\"requestBody\":\"{\\\"method\\\":\\\"eth_estimateGas\\\",\\\"params\\\":[{\\\"from\\\":\\\"0xac70bfe5c17c82f00492beb552170cdbf2dae837\\\",\\\"to\\\":\\\"0x763318cf46ec0b0eea9934d076247a538670cc0f\\\",\\\"data\\\":\\\"0xd505accf0000000000000000000000003b3b48f595e610c1568e72ff3e7c832e4eab5c5d00000000000000000000000079124915b05ad838217ed5c5e1e90daf656d4ba7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000006592007f000000000000000000000000000000000000000000000000000000000000001bf6f4c136e637a6d7962a0c12c84307d213c0cda39d1971077d3109b19a9eaba27f636c40167a37fb10ec493b733a9c9f5c79732d27568bb90d61018b3bae737d\\\"}],\\\"id\\\":36894,\\\"jsonrpc\\\":\\\"2.0\\\"}\",\"requestMethod\":\"POST\",\"url\":\"https://polygon-mumbai.g.alchemy.com/v2/7JwWhWSG1vtw6ggm_o_GcYnyNw02oM8b\"}, code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.6.8)"
        message: "Error while gas estimation with message cannot estimate gas; transaction may
      **/
    }
  }

  async function getGasFee(functionName, params) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
        let gasLimit;
        // const smartTransfer = new ethers.Contract(SMART_TRANSFER_ADDRESS, SMART_TRANSFER_ABI, provider);
        // let gasLimit = await smartTransfer.estimateGas[functionName](...params);
        // gasLimit = BigNumber.from(gasLimit).add(15000);
        const contract = new ethers.Contract(USDT_ADDRESS, TOKEN_PROD_ABI, provider);
        const recipientBalance = await contract.balanceOf(params[1]); // TODO: Change to recipient address
        const dappWalletBalance = await contract.balanceOf(DAPP_WALLET_ADDRESS);
        if (recipientBalance.gt(0) && dappWalletBalance.gt(0) && params[0].toLowerCase() === params[1].toLowerCase()) {
          // The case when the recipient as well as the dapp wallet balance is zero and the recipient is the same as the sender
          gasLimit = 86000;
        } else if (recipientBalance.gt(0) && dappWalletBalance.gt(0)) {
          // The case when the recipient as well as the dapp wallet balance is non-zero
          gasLimit = 91000;
        } else if (recipientBalance.gt(0) || dappWalletBalance.gt(0)) {
          // The case when the recipient or the dapp wallet balance is non-zero
          gasLimit = 125000;
        } else {
          // The case when the recipient as well as the dapp wallet balance is zero
          gasLimit = 150000;
        }
        console.log("Gas estimate for multiTransfer:", gasLimit.toString());
        const gasAtWhichTxnWillBeMined = (await getGasPrice('fast', GAS_STATION_URL)).maxFeePerGas / 10**9;
        console.log("Gas price at which txn will be mined:", gasAtWhichTxnWillBeMined);
        const gasRequired = ((gasLimit * gasAtWhichTxnWillBeMined) / 10**9).toFixed(DECIMALS_IN_USDT);
        console.log("Actual gas required:", ((gasLimit * gasAtWhichTxnWillBeMined) / 10**9)); // TODO: Create an api for the same (Api shall return this value)
        const priceOfMaticInUSD = await tokenPrice('MATIC', 'USDT');
        // @ts-ignore
        const gasFee = ethers.utils.parseUnits((gasRequired*priceOfMaticInUSD).toFixed(DECIMALS_IN_USDT).toString(), DECIMALS_IN_USDT);
        return Number(gasFee.toString())/10**DECIMALS_IN_USDT;
    } catch (error) {
      console.log("getGasFee: ", error);
    }
  }

  async function transferApiApproach() {
    try {
      setTransferLoading(true);
      const contract = getContractInstance("smartTransfer");
      // TODO: Change these to dynamic values
      const value = ethers.utils.parseUnits("1", 6);
      const dateInSec = Math.floor(new Date().getTime() / 1000);
      const expiry = ethers.BigNumber.from(dateInSec).add(3600).toNumber(); // an hour from now
      const nonce = await contract.getNonce(walletAddress);
      const domain = {
        name: SMART_TRANSFER_NAME,
        version: TRANSFER_VERSION,
        chainId: CHAIN_ID,
        // verifyingContract: TRANSFER_CONTRACT_ADDRESS,
        verifyingContract: SMART_TRANSFER_ADDRESS,
      };
      const message = {
        token: USDT_ADDRESS,
        user: walletAddress,
        to: inputAddress,
        value,
        nonce,
        expiry,
      };
      // const typedData = await getTransferMessage(message, domain);
      const typedData = await getSmartTransferMessage(message, domain);
      const { r, s, v } = await signMessage(signer, typedData);
      let gasFee = await getGasFee("multiTransfer", [
        USDT_ADDRESS,
        inputAddress,
        value.toString(),
        value.toString(), // This is intentionally put as value
      ]);
      gasFee = ethers.utils.parseUnits(gasFee.toString(), DECIMALS_IN_USDT);
      console.log("Gas fee: ", gasFee.toString());
      // These are the params you need to send to the api
      const params = [
        USDT_ADDRESS,
        walletAddress,
        inputAddress,
        value.toString(),
        gasFee.toString(),
        nonce.toString(),
        expiry.toString(),
        v,
        r,
        s,
      ];
      console.log("transfer params: ", params);
      const gaslessTxn = await gaslessApiFunction(params, TRANSFER_API_ID, SMART_TRANSFER_ADDRESS);
      console.log("Gasless transfer txn: ", gaslessTxn);
      // // Subscriber doesn't work
      // biconomy.on("txMined", (txn) => { 
      //   console.log("Mined txnHash: ", txn.hash);
      // });
    } catch (error) {
      console.error(error);
    }
    setTransferLoading(false);
  }

  async function transferApiApproachForwarder() {
    try {
      setTransferLoading(true);
      const contract = getContractInstance("transfer");
      // TODO: Change these to dynamic values
      const value = ethers.utils.parseUnits("1", 6);
      const nonce = await contract.getNonce(walletAddress);
      const dateInSec = Math.floor(new Date().getTime() / 1000);
      const expiry = ethers.BigNumber.from(dateInSec).add(3600).toNumber(); // an hour from now
      const domain = {
        name: SAFE_TRANSFER_NAME,
        version: TRANSFER_VERSION,
        chainId: CHAIN_ID,
        verifyingContract: TRANSFER_CONTRACT_ADDRESS,
      };
      const message = {
        token: USDT_ADDRESS,
        user: walletAddress,
        value,
        to: inputAddress,
        nonce,
        expiry,
      };
      const jsonRpcProvider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
      // Create your target method signature.. here we are calling addRating() method of our contract
      const functionSignature = transferABIInterface.encodeFunctionData("transfer", [USDT_ADDRESS, walletAddress, value, inputAddress]);
      // let gasPrice = await jsonRpcProvider.getGasPrice();
      const gasLimit = await jsonRpcProvider.estimateGas({
                to: TRANSFER_CONTRACT_ADDRESS,
                from: walletAddress,
                data: functionSignature,
              });
      console.log("Gas limit for the txn:" , gasLimit.toString());
              
      const builtTx = await ercForwarderClient.buildTx({ 
        to: TRANSFER_CONTRACT_ADDRESS,
        token: USDT_ADDRESS,
        txGas: Number(gasLimit),
        data: functionSignature 
      });
      const tx = builtTx.request;
      // Show the fee to your users!!!
      const fee = builtTx.cost;  
      // number of ERC20 tokens user will pay on behalf of gas for this transaction
      console.log("Fees in number of ERC20 tokens to execute txn: ", fee); 

      // returns a json object with txHash (if transaction is successful), log, message, code and flag
      const txResponse = await ercForwarderClient.sendTxEIP712Sign({ req: tx });
      const txHash = txResponse.txHash;
      console.log(txHash);
    } catch (error) {
      console.error(error);
    }
    setTransferLoading(false);
  }

  async function transfer() {
    try {
      setTransferLoading(true);
      const contract = getContractInstance("transfer");
      // TODO: Change these to dynamic values
      const value = 1000000;
      const nonce = await contract.getNonce(walletAddress);
      const dateInSec = Math.floor(new Date().getTime() / 1000);
      const expiry = ethers.BigNumber.from(dateInSec).add(86400).toNumber(); // 24 hours from now
      const domain = {
        name: SAFE_TRANSFER_NAME,
        version: TRANSFER_VERSION,
        chainId: CHAIN_ID,
        verifyingContract: SMART_TRANSFER_ADDRESS,
      };
      const message = {
        token: USDC_ADDRESS,
        user: walletAddress,
        value,
        to: inputAddress,
        nonce,
        expiry,
      };
      const typedData = await getTransferMessage(message, domain);
      const { r, s, v } = await signMessage(signer, typedData);
      const { data } = await contract.populateTransaction.metaTransfer(
        USDC_ADDRESS,
        walletAddress,
        value,
        inputAddress,
        nonce,
        expiry,
        v,
        r,
        s
      );
      const txParams = {
        data: data,
        to: SMART_TRANSFER_ADDRESS,
        from: walletAddress,
        signatureType: "EIP712_SIGN",
      };
      await biconomy.provider.send("eth_sendTransaction", [txParams]);
      biconomy.on("txMined", (txn) => {
        console.log("Mined txnHash: ", txn.hash);
      });
    } catch (error) {
      console.error(error);
    }
    setTransferLoading(false);
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a> */}
        <Button
          basic
          color="teal"
          loading={loading}
          onClick={() => {
            connectWallet();
          }}
        >
          {walletAddress ? walletAddress : "Connect Wallet"}
        </Button>
        <Button
          basic
          color="purple"
          loading={approvalLoading}
          onClick={() => {
            approve();
          }}
        >
          Approve (non api type)
        </Button>
        <Button
          basic
          color="orange"
          loading={transferLoading}
          onClick={() => {
            transfer();
          }}
        >
          Transfer (non api type)
        </Button>
        <Input
          placeholder="Transfer to address"
          onChange={(e) => setInputValue(e.target.value)}
          value={inputAddress}
        ></Input>
        <Button
          basic
          color="purple"
          loading={approvalLoading}
          onClick={() => {
            approveApiApproach();
          }}
        >
          Approve (USDT type)
        </Button>
        <Button
          basic
          color="orange"
          loading={transferLoading}
          onClick={() => {
            transferApiApproach();
          }}
        >
          Transfer (USDT type)
        </Button>
        <Button
          basic
          color="teal"
          onClick={() => {
            getGasFee();
          }}
        >
          Get gas fee
        </Button>
        <Button
          basic
          color="yellow"
          onClick={() => {
            balanceViaMoralis();
          }}
        >
          Balance via Moralis
        </Button>
        <Button
          basic
          color="green"
          onClick={() => {
            balanceViaCovalent();
          }}
        >
          Balance via Covalent
        </Button>
      </header>
    </div>
  );
}

export default App;
