pragma solidity ^0.4.24;

import "./Library.sol";
import "./AraToken.sol";
import "bytes/BytesLib.sol";

contract AFS {

  using BytesLib for bytes;

  address   public owner_;
  string    public version_ = "1";

  AraToken  public token_;
  Library   public lib_;

  bytes32   public did_;
  bool      public listed_;
  mapping(uint256 => uint256) public prices_; // quantity (lower bound) => price
  uint256[] public priceTiers_; // quantity tiers

  int256    public totalCopies_ = -1; // scarcity quantity; -1 for unlimited copies

  uint256   public minResalePrice_;
  uint256   public maxNumResales_; // < maxNumResales_ can be resold

  mapping(bytes32 => Job)     public jobs_; // jobId => job { budget, sender }
  mapping(bytes32 => uint256) public rewards_;    // farmer => rewards
  mapping(bytes32 => Content) public purchasers_; // keccak256 hashes of buyer addresses
  mapping(uint8 => mapping (uint256 => bytes)) public metadata_;

  struct Job {
    address sender;
    uint256 budget;
  }

  struct Content {
    uint256 quantity;
    uint256 resalePrice;
    mapping(uint256 => uint256) resales; // total quantity owned => number of previous resales -- 0 indexed
  }

  event Commit(bytes32 _did);
  event Unlisted(bytes32 _did);
  event MinResalePriceSet(bytes32 _did, uint256 _price);
  event ResalePriceSet(bytes32 _did, address _purchaser, uint256 _price);
  event MaxNumResalesSet(bytes32 _did, uint256 _quantity);
  event PriceSet(bytes32 _did, uint256 _quantity, uint256 _price);
  event BudgetSubmitted(bytes32 _did, bytes32 _jobId, uint256 _budget);
  event RewardsAllocated(bytes32 _did, uint256 _allocated, uint256 _returned);
  event Purchased(bytes32 _purchaser, bytes32 _did, uint256 _quantity, uint256 _price);
  event PurchasedResale(bytes32 _purchaser, bytes32 _did, uint256 _quantity, uint256 _price);
  event Redeemed(address _sender);
  event IncreasedSupply(bytes32 _did, int256 _added, int256 _total);
  event DecreasedSupply(bytes32 _did, int256 _removed, int256 _total);
  event UnlimitedSupplySet(bytes32 _did);

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
      purchasers_[keccak256(abi.encodePacked(msg.sender))].quantity > 0,
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
    int256 totalCopies;
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
        btsptr := add(_data, 160)
        totalCopies := mload(btsptr)
    }
    owner_    = ownerAddr;
    token_    = AraToken(tokenAddr);
    lib_      = Library(libAddr);
    did_      = did;
    listed_   = true;
    totalCopies_ = totalCopies;
  }

/**
 * COMMERCE
 * ===============================================================================================
 */

  function setPrice(uint256 _quantity, uint256 _price) external onlyBy(owner_) {
    require(_quantity > 0, "Quantity must be greater than 0.");
    require(_price > 0, "Price must be greater than 0.");
    if (prices_[_quantity] == 0) {
      priceTiers_.push(_quantity);
    }
    prices_[_quantity] = _price;
    emit PriceSet(did_, _quantity, prices_[_quantity]);
  }

  function getPrice(uint256 _quantity) public view returns (uint256) {
    uint256 tier;
    for (uint256 i = 0; i < priceTiers_.length; i++) {
      if (priceTiers_[i] == _quantity) {
        return prices_[_quantity];
      } else if (priceTiers_[i] < _quantity && priceTiers_[i] > tier) {
        tier = priceTiers_[i];
      }
    }
    return prices_[tier];
  }

  function setMinResalePrice(uint256 _price) external onlyBy(owner_) {
    minResalePrice_ = _price;
    emit MinResalePriceSet(did_, _price);
  }

  function setResalePrice(uint256 _price) external purchaseRequired {
    require(_price >= minResalePrice_, "Resale price must be at least the minimum resale price.");
    purchasers_[keccak256(abi.encodePacked(msg.sender))].resalePrice = _price;
    emit ResalePriceSet(did_, msg.sender, _price);
  }

  function setResaleQuantity(uint256 _quantity) external onlyBy(owner_) {
    maxNumResales_ = _quantity;
    emit MaxNumResalesSet(did_, maxNumResales_);
  }

  function increaseSupply(int256 _quantity) public onlyBy(owner_) {
    require(_quantity > 0, "Quantity must be greater than 0.");
    if (totalCopies_ < 0) {
      totalCopies_ = _quantity;
    } else {
      totalCopies_ += _quantity;
    }
    emit IncreasedSupply(did_, _quantity, totalCopies_);
  }

  function decreaseSupply(int256 _quantity) public onlyBy(owner_) {
    require(_quantity > 0, "Cannot remove non-positive number of copies.");
    require(totalCopies_ > 0, "Cannot remove anymore copies.");
    require(totalCopies_ - _quantity >= 0, "Trying to remove more copies than already exist.");
    totalCopies_ -= _quantity;
    emit DecreasedSupply(did_, _quantity, totalCopies_);
  }

  function setUnlimitedSupply() public onlyBy(owner_) {
    totalCopies_ = -1;
    emit UnlimitedSupplySet(did_);
  }

/**
 * PURCHASE
 * ===============================================================================================
 */

  /**
   * @dev Purchases this AFS and adds it to _purchaser's library. 
   *      If _download is true, deposits any remaining allowance 
   *      as rewards for this purchase
   * @param _purchaser The hashed methodless did of the purchaser
   * @param _jobId The jobId of the download, or 0x00000000000000000000000000000000 if N/A
   * @param _budget The reward budget for jobId, or 0 if N/A
   */
  function purchase(bytes32 _purchaser, uint256 _quantity, bytes32 _jobId, uint256 _budget) external {
    require(totalCopies_ != 0, "No more copies available for purchase.");
    require(_quantity > 0, "Must purchase at least 1 copy.");
    uint256 allowance = token_.allowance(msg.sender, address(this));
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require (allowance >= (_quantity * prices_[_quantity]) + _budget, "Proxy must be approved for purchase.");

    if (token_.transferFrom(msg.sender, owner_, _quantity * prices_[_quantity])) {
      purchasers_[hashedAddress].quantity += _quantity;
      purchasers_[hashedAddress].resalePrice = minResalePrice_;
      if (totalCopies_ > 0) {
        totalCopies_--;
        if (totalCopies_ == 0) {
          unlist();
        }
      }
      lib_.addLibraryItem(_purchaser, did_);
      emit Purchased(_purchaser, did_, _quantity, _quantity * prices_[_quantity]);

      if (_jobId != bytes32(0) && _budget > 0) {
        submitBudget(_jobId, _budget);
      }
    }
  }

  /**
   * @param _seller seller's Ethereum address
   * 
   */
  function purchaseResale(address _seller, bytes32 _purchaser, uint256 _quantity, bytes32 _jobId, uint256 _budget) external {
    require(maxNumResales_ > 0, "Item is not available for resale.");
    require(_quantity > 0, "Must purchase at least 1 copy.");
    bytes32 seller = keccak256(abi.encodePacked(_seller));
    require(purchasers_[seller].quantity > 0, "Seller must own at least 1 copy.");
    require(purchasers_[seller].resales[_quantity - 1] == maxNumResales_, "Copy has already been sold the maximum number of times.");
    uint256 allowance = token_.allowance(msg.sender, address(this));
    require (allowance >= (_quantity * purchasers_[seller].resalePrice) + _budget, "Proxy must be approved for purchase.");

    if (token_.transferFrom(msg.sender, _seller, _quantity * (purchasers_[seller].resalePrice - minResalePrice_))
      && token_.transferFrom(msg.sender, owner_, _quantity * minResalePrice_)) {
      purchasers_[seller].quantity -= _quantity;

      bytes32 purchaser = keccak256(abi.encodePacked(msg.sender));
      uint256 oldPurchaserQuantity = purchasers_[purchaser].quantity;
      for (uint256 i = 0; i < _quantity; i++) {
        purchasers_[seller].resales[i + purchasers_[seller].quantity] = 0;
        purchasers_[purchaser].resales[i + oldPurchaserQuantity]++;
      }

      purchasers_[purchaser].quantity += _quantity;
      purchasers_[purchaser].resalePrice = minResalePrice_;
      lib_.addLibraryItem(_purchaser, did_);
      emit PurchasedResale(_purchaser, did_, _quantity, _quantity * prices_[_quantity]);

      if (_jobId != bytes32(0) && _budget > 0) {
        submitBudget(_jobId, _budget);
      }
    }
  }

/**
 * REWARDS
 * ===============================================================================================
 */

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

  function getBudget(bytes32 _jobId) public view returns (uint256) {
    return jobs_[_jobId].budget;
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

/**
 * STORAGE
 * ===============================================================================================
 */

  function append(uint256[] _mtOffsets, uint256[] _msOffsets, bytes _mtBuffer, 
    bytes _msBuffer) external onlyBy(owner_) {
    
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
    bytes _msBuffer) public onlyBy(owner_) {

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

  function unlist() public onlyBy(owner_) returns (bool success) {
    listed_ = false;
    emit Unlisted(did_);
    return true;
  }
}
