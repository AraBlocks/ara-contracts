pragma solidity ^0.5.16;

import './Ownable.sol';
import './Library.sol';
import './AraToken.sol';
import 'bytes/BytesLib.sol';
import '../SafeMath32.sol';
import '../SafeMath.sol';

contract AFSestimate is Ownable {
  using SafeMath for uint256;
  using BytesLib for bytes;

  string   public version_ = '2_estimate';

  AraToken public token_;
  Library  public lib_;

  bytes32  public did_;
  bool     public listed_;
  uint256  public price_;

  uint256  public depositRequirement_;

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
  event PriceSet(uint256 _price);
  event BudgetSubmitted(address indexed _sender, bytes32 indexed _jobId, uint256 _budget);
  event RewardsAllocated(address indexed _farmer, bytes32 indexed _jobId, uint256 _allocated, uint256 _remaining);
  event InsufficientDeposit(address indexed _farmer);
  event Purchased(bytes32 indexed _purchaser, uint256 _price);
  event Redeemed(address indexed _sender, uint256 _amount);

  uint8 constant mtBufferSize_ = 40;
  uint8 constant msBufferSize_ = 64;

  modifier purchaseRequired()
  {
    require(
      purchasers_[keccak256(abi.encodePacked(msg.sender))],
      'Content was never purchased.'
    );
    _;
  }

  modifier budgetSubmitted(bytes32 _jobId)
  {
    require(
      jobs_[_jobId].sender == msg.sender && jobs_[_jobId].budget > 0,
      'Job is invalid.'
    );
    _;
  }

  function init(bytes memory _data) public {
    require(owner_ == address(0), 'This AFS standard has already been initialized.');
  
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
    owner_    = ownerAddr;
    token_    = AraToken(tokenAddr);
    lib_      = Library(libAddr);
    did_      = did;
    listed_   = true;
    price_    = 0;
    depositRequirement_  = 100 * 10 ** token_.decimals();
  }

  function setPrice(uint256 _price) external {
    price_ = _price;
    emit PriceSet(price_);
  }

  function submitBudget(bytes32 _jobId, uint256 _budget) public purchaseRequired {
    uint256 allowance = token_.allowance(msg.sender, address(this));
    require(_jobId != bytes32(0) && _budget > 0 && allowance >= _budget
      && (jobs_[_jobId].sender == address(0) || jobs_[_jobId].sender == msg.sender), 'Job submission invalid.');

    if (token_.transferFrom(msg.sender, address(this), _budget)) {
      jobs_[_jobId].budget = jobs_[_jobId].budget.add(_budget);
      jobs_[_jobId].sender = msg.sender;
      assert(jobs_[_jobId].budget <= token_.balanceOf(address(this)));
      emit BudgetSubmitted(msg.sender, _jobId, _budget);
    }
  }

  function allocateRewards(bytes32 _jobId, address[] memory _farmers, uint256[] memory _rewards) public budgetSubmitted(_jobId) {
    require(_farmers.length > 0, 'Must allocate to at least one farmer.');
    require(_farmers.length == _rewards.length, 'Unequal number of farmers and rewards.');
    uint256 totalRewards = 0;
    for (uint256 i = 0; i < _rewards.length; i++) {
      address farmer = _farmers[i];
      require(farmer != msg.sender, 'Cannot allocate rewards to job creator.');
      require(farmer == owner_ || purchasers_[keccak256(abi.encodePacked(farmer))] || token_.amountDeposited(farmer) >= depositRequirement_, 'Farmer must be a purchaser of this AFS or have sufficient token deposit.');
      totalRewards = totalRewards.add(_rewards[i]);
    }
    require(totalRewards <= jobs_[_jobId].budget, 'Insufficient budget.');
    for (uint256 j = 0; j < _farmers.length; j++) {
      assert(jobs_[_jobId].budget >= _rewards[j]);
      bytes32 hashedFarmer = keccak256(abi.encodePacked(_farmers[j]));
      rewards_[hashedFarmer] = rewards_[hashedFarmer].add(_rewards[j]);
      jobs_[_jobId].budget = jobs_[_jobId].budget.sub(_rewards[j]);
      emit RewardsAllocated(_farmers[j], _jobId, _rewards[j], jobs_[_jobId].budget);
    }
  }

  function redeemBalance() public {
    if (msg.sender == owner_ || token_.amountDeposited(msg.sender) >= depositRequirement_ || purchasers_[keccak256(abi.encodePacked(msg.sender))]) {
      bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
      require(rewards_[hashedAddress] > 0, 'No balance to redeem.');
      if (token_.transfer(msg.sender, rewards_[hashedAddress])) {
        emit Redeemed(msg.sender, rewards_[hashedAddress]);
        rewards_[hashedAddress] = 0;
      }
    } else {
      emit InsufficientDeposit(msg.sender);
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
    require(listed_, 'Content is not listed for purchase.');
    uint256 allowance = token_.allowance(msg.sender, address(this));
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require (!purchasers_[hashedAddress] && allowance >= price_.add(_budget), 'Unable to purchase.');

    if (token_.transferFrom(msg.sender, owner_, price_)) {
      purchasers_[hashedAddress] = true;
      lib_.addLibraryItem(_purchaser, did_);
      emit Purchased(_purchaser, price_);

      if (_jobId != bytes32(0) && _budget > 0) {
        submitBudget(_jobId, _budget);
      }
    }
  }

  function append(uint256[] calldata _mtOffsets, uint256[] calldata _msOffsets, bytes calldata _mtBuffer, 
    bytes calldata _msBuffer) external {
    
    require(listed_, 'AFS is unlisted.');
    
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

  function write(uint256[] memory _mtOffsets, uint256[] memory _msOffsets, bytes memory _mtBuffer, 
    bytes memory _msBuffer) public {

    require(listed_, 'AFS is unlisted.');

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

  function read(uint8 _file, uint256 _offset) public view returns (bytes memory buffer) {
    if (!listed_) {
      return ''; // empty bytes
    }
    return metadata_[_file][_offset];
  }

  function hasBuffer(uint8 _file, uint256 _offset, bytes memory _buffer) public view returns (bool exists) {
    return metadata_[_file][_offset].equal(_buffer);
  }

  function unlist() public returns (bool success) {
    listed_ = false;
    emit Unlisted(did_);
    return true;
  }
}
