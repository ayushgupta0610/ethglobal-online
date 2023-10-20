// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

// import "./GasEstimator.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/EIP712.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Context.sol";

contract SmartTransfer is Context, EIP712 {

    address public owner;
    address public dappWallet;
    mapping(address => uint256) public getNonce;
    event Transfer(address indexed token, address indexed sender, uint256 amount, address to, uint256 timestamp);

    // bytes32 public constant _META_TRANSFER_TYPEHASH = keccak256("MetaTransfer(address token,address user,address to,uint256 value,uint256 nonce,uint256 expiry)");
    bytes32 public constant _META_TRANSFER_TYPEHASH = 0xb3587acf1a0d01078951fded65d206a92628776c5d42613b0e6cc776a6414f9b;

    modifier onlyOwner {
        require(_msgSender() == owner, "Access Denied");
        _;
    }

    constructor(address _dappWallet, string memory _name, string memory _version) EIP712(_name, _version) {
        owner = msg.sender;
        dappWallet = _dappWallet;
    }

    function setDappWallet(address _dappWallet) external onlyOwner {
        dappWallet = _dappWallet;
    }

    function multiTransfer(address _token, address _to, uint256 _value, uint256 _gasFee) external {
        _multiTransfer(_token, _msgSender(), _to, _value, _gasFee);
    }

    function _multiTransfer(address _token, address _user, address _to, uint256 _value, uint256 _gasFee) private {
        require(IERC20(_token).balanceOf(_user) >= (_value+_gasFee), "ST: Insufficient balance");
        require(IERC20(_token).allowance(_user, address(this)) >= (_value+_gasFee), "ST: Insufficient allowance");
        bool transferGasBool = standardTransferFrom(_token, _user, dappWallet, _gasFee);
        bool transferValueBool = standardTransferFrom(_token, _user, _to, _value);
        if (!transferGasBool || !transferValueBool) {
            revert("ST: Transfer failed");
        }
    }
    
    function standardTransferFrom(address _token, address _user, address _to, uint256 _value) private returns (bool success) {
        // Check if the transfer amount is not zero
        if (_value == 0) {
            revert("ST: Transfer amount is zero");
        }
        // Check if the recipient's address is zero address
        if (_to == address(0)) {
            revert("ST: Recipient address is zero");
        }
        // TODO: Not implemented safeTransferFrom
        success = IERC20(_token).transferFrom(_user, _to, _value);
        require(success, "ST: Action unsuccessful");
        emit Transfer(_token, _user, _value, _to, block.timestamp);
    }

    function metaTransfer(address _token, address _user, address _to, uint256 _value, uint256 _gasFee, uint256 _nonce, uint256 _expiry, uint8 _v, bytes32 _r, bytes32 _s) external {
        // Check for user's balance
        uint256 balance = IERC20(_token).balanceOf(_user);
        require(_value + _gasFee <= balance, "ST: Insufficient balance");
        
        // Check for token allowance of the contract
        uint256 allowance = IERC20(_token).allowance(_user, address(this));
        require(allowance >= _value + _gasFee, "ST: Insufficient contract allowance");

        // Check if the transfer meta-txn has expired (_expiry = 0 means no expiration)
        require(_expiry == 0 || block.timestamp <= _expiry, "ST: Transfer signature expired");

        // Check if the nonce of the user is correct
        require(_nonce == getNonce[_user]++, "ST: Invalid nonce");

        // Check if the to address is a non-zero address
        // require(_to != address(0), "ST: Zero address provided");

        bytes32 structHash =
            keccak256(
                abi.encode(
                    _META_TRANSFER_TYPEHASH,
                    _token,
                    _user,
                    _to,
                    _value,
                    _nonce,
                    _expiry
                )
            );
        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ecrecover(hash, _v, _r, _s);
        require(signer == _user, "ST: Invalid signature");
        
        _multiTransfer(_token, _user, _to, _value, _gasFee);
    } 

}