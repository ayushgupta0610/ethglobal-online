const getECSignature = (signature) => {
  const r = signature.slice(0, 66);
  const s = "0x".concat(signature.slice(66, 130));
  const _v = "0x".concat(signature.slice(130, 132));
  let v = parseInt(_v);
  if (![27, 28].includes(v)) v += 27;
  return { r, s, v };
};

export const signMessage = async (walletProvider, typedData) => {
  let signedMessage;
  if ("getSigner" in walletProvider) {
    const account = await walletProvider.getSigner().getAddress();
    signedMessage = await walletProvider.send("eth_signTypedData_v4", [
      account,
      JSON.stringify(typedData),
    ]);
  } else {
    const { EIP712Domain, ...otherTypes } = typedData.types;
    const typedDataTypes = { ...otherTypes };
    signedMessage = await walletProvider._signTypedData(
      typedData.domain,
      typedDataTypes,
      typedData.message
    );
  }

  const { r, s, v } = getECSignature(signedMessage);

  return { r, s, v };
};

export const getMaticMetaTransactionMessage = (message, domain) => {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "uint256" },
      ],
      MetaTransaction: [
        { name: "nonce", type: "uint256" },
        { name: "from", type: "address" },
        { name: "functionSignature", type: "bytes" },
      ],
    },
    domain,
    primaryType: "MetaTransaction",
    message,
  };
};

export const getTransferMessage = (message, domain) => {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      MetaTransfer: [
        { name: "token", type: "address" },
        { name: "user", type: "address" },
        { name: "value", type: "uint256" },
        { name: "to", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
      ],
    },
    domain,
    primaryType: "MetaTransfer",
    message,
  };
};

export const getPermitMessage = (message, domain) => {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    domain,
    primaryType: "Permit",
    message,
  };
};

export const getSmartTransferMessage = (message, domain) => {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      MetaTransfer: [
        { name: "token", type: "address" },
        { name: "user", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
      ],
    },
    domain,
    primaryType: "MetaTransfer",
    message,
  };
};