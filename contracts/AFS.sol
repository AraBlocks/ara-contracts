pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Library.sol";
import "./AraToken.sol";
import "bytes/BytesLib.sol";

contract AFS is Ownable {

  using BytesLib for bytes;

  string   public version_ = "1";

  AraToken public token_;
  Library  public lib_;

  bytes32  public did_;
  bool     public listed_;
  uint256  public price_;

  mapping(bytes32 => Job)     public jobs_; // jobId => job { budget, sender }
  mapping(bytes32 => uint256) public rewards_;    // farmer => rewards
  mapping(bytes32 => bool)    public purchasers_; // keccak256 hashes of buyer addresses
  mapping(uint8 => mapping (uint256 => bytes))   public metadata_;

  struct Job {
    address sender;
    uint256 budget;
  }

  event Commit(bytes32 _did);
  event Unlisted(bytes32 _did);
  event PriceSet(bytes32 _did, uint256 _price);
  event BudgetSubmitted(bytes32 _did, bytes32 _jobId, uint256 _budget);
  event RewardsAllocated(bytes32 _did, uint256 _allocated, uint256 _returned);
  event Purchased(bytes32 _purchaser, bytes32 _did, uint256 _price);
  event Redeemed(address _sender);

  uint8 constant mtBufferSize_ = 40;
  uint8 constant msBufferSize_ = 64;

  modifier onlyBy(address _account)
  {
    require(
      msg.sender == _account,
      "Sender not authorized."
    );
    _;
  }

  modifier purchaseRequired()
  {
    require(
      purchasers_[keccak256(abi.encodePacked(msg.sender))],
      "Content was never purchased."
    );
    _;
  }

  modifier budgetSubmitted(bytes32 _jobId)
  {
    require(
      jobs_[_jobId].sender == msg.sender && jobs_[_jobId].budget > 0,
      "Job is invalid."
    );
    _;
  }

  function init(bytes _data) public {
    uint256 btsptr;
    address ownerAddr;
    address tokenAddr;
    address libAddr;
    bytes32 did;
    /* solium-disable-next-line security/no-inline-assembly */
    assembly {
      btsptr := add(_data, 32)
      ownerAddr := mload(btsptr)
      btsptr := add(_data, 64)
      tokenAddr := mload(btsptr)
      btsptr := add(_data, 96)
      libAddr := mload(btsptr)
      btsptr := add(_data, 128)
      did := mload(btsptr)
    }
    owner     = ownerAddr;
    token_    = AraToken(tokenAddr);
    lib_      = Library(libAddr);
    did_      = did;
    listed_   = true;
    price_    = 0;
  }

  function setPrice(uint256 _price) external onlyBy(owner) {
    price_ = _price;
    emit PriceSet(did_, price_);
  }

  function submitBudget(bytes32 _jobId, uint256 _budget) public purchaseRequired {
    uint256 allowance = token_.allowance(msg.sender, address(this));
    require(_jobId != bytes32(0) && _budget > 0 && allowance >= _budget
      && (jobs_[_jobId].sender == address(0) || jobs_[_jobId].sender == msg.sender), "Job submission invalid.");

    if (token_.transferFrom(msg.sender, address(this), _budget)) {
      jobs_[_jobId].budget += _budget;
      jobs_[_jobId].sender = msg.sender;
      assert(jobs_[_jobId].budget <= token_.balanceOf(address(this)));
      emit BudgetSubmitted(did_, _jobId, _budget);
    }
  }

  function allocateRewards(bytes32 _jobId, bytes32[] _farmers, uint256[] _rewards) public budgetSubmitted(_jobId) {
    require(_farmers.length == _rewards.length, "Unequal number of farmers and rewards.");
    uint256 totalRewards;
    for (uint8 i = 0; i < _rewards.length; i++) {
      totalRewards += _rewards[i];
    }
    require(totalRewards <= jobs_[_jobId].budget, "Insufficient budget.");
    for (uint8 j = 0; j < _farmers.length; j++) {
      assert(jobs_[_jobId].budget >= _rewards[j]);
      rewards_[_farmers[j]] = _rewards[j];
      jobs_[_jobId].budget -= _rewards[j];
    }
    uint256 remaining = jobs_[_jobId].budget;
    if (remaining > 0) {
      rewards_[keccak256(abi.encodePacked(msg.sender))] = remaining;
      jobs_[_jobId].budget = 0;
      redeemBalance();
    }
    emit RewardsAllocated(did_, totalRewards, remaining);
  }

  function redeemBalance() public {
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require(rewards_[hashedAddress] > 0, "No balance to redeem.");
    if (token_.transfer(msg.sender, rewards_[hashedAddress])) {
      rewards_[hashedAddress] = 0;
      emit Redeemed(msg.sender);
    }
  }

  function getRewardsBalance(address _farmer) public view returns (uint256) {
    return rewards_[keccak256(abi.encodePacked(_farmer))];
  }

  function getBudget(bytes32 _jobId) public view returns (uint256) {
    return jobs_[_jobId].budget;
  }

  /**
   * @dev Purchases this AFS and adds it to _purchaser's library. 
   *      If _download is true, deposits any remaining allowance 
   *      as rewards for this purchase
   * @param _purchaser The hashed methodless did of the purchaser
   * @param _jobId The jobId of the download, or 0x00000000000000000000000000000000 if N/A
   * @param _budget The reward budget for jobId, or 0 if N/A
   */
  function purchase(bytes32 _purchaser, bytes32 _jobId, uint256 _budget) external {
    uint256 allowance = token_.allowance(msg.sender, address(this));
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require (!purchasers_[hashedAddress] && allowance >= price_ + _budget, "Unable to purchase.");

    if (token_.transferFrom(msg.sender, owner, price_)) {
      purchasers_[hashedAddress] = true;
      lib_.addLibraryItem(_purchaser, did_);
      emit Purchased(_purchaser, did_, price_);

      if (_jobId != bytes32(0) && _budget > 0) {
        submitBudget(_jobId, _budget);
      }
    }
  }

  function append(uint256[] _mtOffsets, uint256[] _msOffsets, bytes _mtBuffer, 
    bytes _msBuffer) external onlyBy(owner) {
    
    require(listed_, "AFS is unlisted.");
    
    uint256 maxOffsetLength = _mtOffsets.length > _msOffsets.length 
      ? _mtOffsets.length 
      : _msOffsets.length;

    for (uint i = 0; i < maxOffsetLength; i++) {
      // metadata/tree
      if (i <= _mtOffsets.length - 1) {
        metadata_[0][_mtOffsets[i]] = _mtBuffer.slice(i * mtBufferSize_, mtBufferSize_);
      }

      // metadata/signatures
      if (i <= _msOffsets.length - 1) {
        metadata_[1][_msOffsets[i]] = _msBuffer.slice(i * msBufferSize_, msBufferSize_);
      }
    }

    emit Commit(did_);
  }

  function write(uint256[] _mtOffsets, uint256[] _msOffsets, bytes _mtBuffer, 
    bytes _msBuffer) public onlyBy(owner) {

    require(listed_, "AFS is unlisted.");

    uint256 maxOffsetLength = _mtOffsets.length > _msOffsets.length 
      ? _mtOffsets.length 
      : _msOffsets.length;

    // add headers
    metadata_[0][0] = _mtBuffer.slice(0, 32);
    metadata_[1][0] = _msBuffer.slice(0, 32);

    for (uint i = 1; i < maxOffsetLength; i++) {
      // metadata/tree
      if (i <= _mtOffsets.length - 1) {
        metadata_[0][_mtOffsets[i]] = _mtBuffer.slice(_mtOffsets[i], mtBufferSize_);
      }
      
      // metadata/signatures
      if (i <= _msOffsets.length - 1) {
        metadata_[1][_msOffsets[i]] = _msBuffer.slice(_msOffsets[i], msBufferSize_);
      }
    }

    emit Commit(did_);
  }

  function read(uint8 _file, uint256 _offset) public view returns (bytes buffer) {
    if (!listed_) {
      return ""; // empty bytes
    }
    return metadata_[_file][_offset];
  }

  function hasBuffer(uint8 _file, uint256 _offset, bytes _buffer) public view returns (bool exists) {
    return metadata_[_file][_offset].equal(_buffer);
  }

  function unlist() public onlyBy(owner) returns (bool success) {
    listed_ = false;
    emit Unlisted(did_);
    return true;
  }
}
