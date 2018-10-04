pragma solidity ^0.4.24;

contract Ownable {

  address public owner_;

  event TransferApproved(address indexed _previousOwner, address indexed _newOwner);
  event TransferRequested(address indexed _currentOwner, address indexed _requestedOwner);
  event RequestRevoked(address indexed _currentOwner, address indexed _requestOwner);

  mapping(bytes32 => bool) public requesters_; // keccak256 hashes of requester addresses

  modifier onlyOwner() {
    require(msg.sender == owner_);
    _;
  }

  modifier hasRequested(address _newOwner) {
    require(requesters_[keccak256(abi.encodePacked(_newOwner))], 
      "Owner request has not been sent.");
    _;
  }

  function requestOwnership() public {
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    requesters_[hashedAddress] = true;
    emit TransferRequested(owner_, msg.sender);
  }

  function revokeOwnershipRequest() public hasRequested(msg.sender) {
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    requesters_[hashedAddress] = false;
    emit RequestRevoked(owner_, msg.sender);
  }

  function approveOwnershipTransfer(address _newOwner) public onlyOwner hasRequested(_newOwner) {
    owner_ = _newOwner;
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    requesters_[hashedAddress] = false;
  }

}
