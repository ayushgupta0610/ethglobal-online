// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Permit.sol";

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/EIP712.sol";

contract SafeTransfer is EIP712 {

    address public owner;
    mapping(address => uint256) private nonces;
    event EtherReceived(address indexed sender, uint256 amount);
    event Transfer(address indexed token, address indexed sender, uint256 amount, address to, uint256 timestamp);
    
    bytes32 private constant _META_TRANSFER_TYPEHASH = keccak256("MetaTransfer(address token,address user,uint256 value,address to,uint256 nonce,uint256 expiry)");
   
    modifier onlyOwner {
        require(msg.sender == owner, "Access Denied");
        _;
    }

    constructor(string memory _name, string memory _version) EIP712(_name, _version) {
        owner = msg.sender;
    }
    
    function transfer(address _token, address _user, uint256 _value, address _to) public returns (bool success) {
        success = IERC20(_token).transferFrom(_user, _to, _value);
        require(success, "Action unsuccessful");
        
        emit Transfer(_token, _user, _value, _to, block.timestamp);
        return true;
    }
    
    function metaTransfer(address _token, address _user, uint256 _value, address _to, uint256 _nonce, uint256 _expiry, uint8 _v, bytes32 _r, bytes32 _s) public returns (bool success) {
        
        // Check for user's balance
        uint256 balance = IERC20(_token).balanceOf(_user);
        require(_value <= balance, "Insufficient user balance");
        
        // Check for token allowance of the contract
        uint256 allowance = IERC20(_token).allowance(_user, address(this));
        require(allowance >= _value, "Insufficient contract allowance");

        // Check if the transfer meta-txn has expired
        require(_expiry == 0 || block.timestamp <= _expiry, "Transfer approval expired");

        // Check if the nonce of the user is correct
        require(_nonce == nonces[_user]++, "Invalid nonce");

        // Check if the to address is a non-zero address
        require(_to != address(0), "Zero address provided");

        bytes32 structHash =
            keccak256(
                abi.encode(
                    _META_TRANSFER_TYPEHASH,
                    _token,
                    _user,
                    _value,
                    _to,
                    _nonce,
                    _expiry
                )
            );
        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ecrecover(hash, _v, _r, _s);
        require(signer == _user, "Invalid signature");
        
        return transfer(_token, _user, _value, _to);
    } 

    function getNonce(address _user) external view returns (uint) {
        return nonces[_user];
    }
    
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // In case anyone transfers any ERC20 tokens to this contract by mistake
    function withdrawERC20(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(owner, balance);
    }

    // In case anyone transfers any ether to this contract by mistake
    function withdrawEther() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool sent, ) = owner.call{ value: balance }("");
        require(sent, "Failed to send Ether");
    }

}