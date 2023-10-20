// import logo from "./logo.svg";
import { Biconomy } from "@biconomy/mexa";
import axios from "axios";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { Button } from "semantic-ui-react";
import "./App.css";
import {
  SMART_TRANSFER_ABI,
  TOKEN_ABI,
  TOKEN_PROD_ABI,
  TRANSFER_ABI,
} from "./ethereum/abis";
import {
  BICONOMY_KEY,
  GAS_STATION_URL,
  SMART_TRANSFER_ADDRESS,
  TOKEN,
  TRANSFER_CONTRACT_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS
} from "./ethereum/config";
import {
  SismoConnectButton,
  AuthType,
  SismoConnectResponse,
  ClaimType,
} from "@sismo-core/sismo-connect-react";
import ReactSismo from "./components/ReactSismo";

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
        contractAddresses: [
          USDC_ADDRESS,
          USDT_ADDRESS,
          TRANSFER_CONTRACT_ADDRESS,
          SMART_TRANSFER_ADDRESS,
        ],
        debug: false,
        strictMode: true,
      });
      await biconomyInstance.init();
      console.log("Biconomy instance: ", biconomyInstance);
      console.log(
        "Biconomy erc20ForwarderClient: ",
        biconomyInstance.erc20ForwarderClient
      );
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
      contractInstance = new ethers.Contract(
        SMART_TRANSFER_ADDRESS,
        SMART_TRANSFER_ABI,
        biconomy.signer
      );
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
    const maxPriorityFeePerGas =
      Math.ceil(data.standard.maxPriorityFee) * 10 ** 9;
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

  return (
    <div className="App">
      <header className="App-header">
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
            transfer();
          }}
        >
          Approve (non api type)
        </Button>
        <ReactSismo></ReactSismo>
      </header>
    </div>
  );
}

export default App;
