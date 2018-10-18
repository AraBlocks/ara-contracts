pragma solidity ^0.4.24;

import "./Ownable.sol";
import "./Library.sol";
import "./AraToken.sol";
import "bytes/BytesLib.sol";

contract AFS is Ownable {
  using BytesLib for bytes;

  uint8 constant mtBufferSize_ = 40;
  uint8 constant msBufferSize_ = 64;

  bool      private once_;
  bool      public resellable_;

  address   public owner_;

  AraToken  public token_;
  Library   public lib_;

  bytes32   public did_;
  bool      public listed_;
  mapping(uint256 => uint256) public prices_; // quantity (lower bound) => price
  uint256[] public priceTiers_; // quantity tiers

  uint256   public currGlobalConfigID_;
  mapping(uint256 => GlobalResaleConfig)       public globalConfigs_; // configID => GlobalResaleConfig

  uint256   public totalCopies_; // scarcity quantity
  bool      public unlimited_ = false;

  uint256   public minResalePrice_;
  uint256   public maxNumResales_; // < maxNumResales_ can be resold

  mapping(bytes32 => Job)                      public jobs_; // jobId => job { budget, sender }
  mapping(bytes32 => uint256)                  public rewards_;    // farmer => rewards
  mapping(bytes32 => Purchases)                public purchases_; // keccak256 hashes of buyer addresses
  mapping(uint8 => mapping (uint256 => bytes)) public metadata_;

  Royalties public royalties_;

  struct Job {
    address sender;
    uint256 budget;
  }

  struct GlobalResaleConfig {
    bool locked;

    uint256  minResalePrice;
    uint256  maxNumResales;
  }

  struct ResaleConfig {
    bool enabled;

    // reseller set config
    uint256 resalePrice;
    uint256 available;
    uint256 quantity;
    uint256[] resales; // total quantity owned => number of previous resales -- 0 indexed
  }

  struct Purchases {
    uint256[] configIDs;
    mapping(uint256 => uint256) configIDIndices; // configID => configIDs index
    mapping(uint256 => ResaleConfig) configs; // configID => ResaleConfig

    uint256 quantity; // of non-resellable purchases independent of configs
  }

  struct Royalties {
    mapping(bytes32 => uint256) split;
    bytes32[] hashedAddresses;
    uint256 ownerProfit;
  }

  // constants
  uint256 public constant royaltyMultiplier = 100 * 10 ** 2;

  event Commit(bytes32 _did);
  event Unlisted(bytes32 _did);
  event Listed(bytes32 _did);
  event MinResalePriceSet(bytes32 _did, uint256 _price);
  event ResalePriceSet(bytes32 _did, address _purchaser, uint256 _price);
  event MaxNumResalesSet(bytes32 _did, uint256 _quantity);
  event PriceSet(bytes32 _did, uint256 _quantity, uint256 _price);
  event BudgetSubmitted(bytes32 _did, bytes32 _jobId, uint256 _budget);
  event RewardsAllocated(bytes32 _did, uint256 _allocated, uint256 _returned);
  event Purchased(bytes32 _purchaser, bytes32 _did, uint256 _quantity, uint256 _price, uint256 _configID);
  event PurchasedResale(bytes32 _purchaser, address _seller, bytes32 _did, uint256 _quantity, uint256 _price, uint256 _configID);
  event Redeemed(address _sender);
  event IncreasedSupply(bytes32 _did, uint256 _added, uint256 _total);
  event DecreasedSupply(bytes32 _did, uint256 _removed, uint256 _total);
  event SupplySet(bytes32 _did, uint256 _quantity);
  event ResaleUnlocked(bytes32 _did, address _seller, uint256 _available);
  event ResaleLocked(bytes32 _did, address _seller, uint256 _available);
  event MarkedForResale(bytes32 _did);
  event MarkedNotForResale(bytes32 _did);
  event ResaleUnlocked(bytes32 _did);
  event ResaleLocked(bytes32 _did);
  event RoyaltiesPaidOut(bytes32[] _hashedAddresses, uint256[] _amounts, uint256 _price, uint256[] _profits);

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
      purchases_[keccak256(abi.encodePacked(msg.sender))].quantity > 0,
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

  modifier onlyOnce()
  {
    require(!once_, "Init function can only be called once.");
    _;
  }

  function init(bytes _data) public onlyOnce {
    once_ = true;
    uint256 btsptr;
    address ownerAddr;
    address tokenAddr;
    address libAddr;
    bytes32 did;
    uint256 totalCopies;
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
    owner_       = ownerAddr;
    token_       = AraToken(tokenAddr);
    lib_         = Library(libAddr);
    did_         = did;
    totalCopies_ = totalCopies;
    if (0 == totalCopies_) {
      unlimited_ = true;
    }
  }

/**
 * CREATOR COMMERCE
 * ===============================================================================================
 */

  function list() public onlyBy(owner_) {
    listed_ = true;
    emit Listed(did_);
  }

  function unlist() public onlyBy(owner_) {
    listed_ = false;
    emit Unlisted(did_);
  }

  function unlockResale(uint256 _globalConfigID) public onlyBy(owner_) {
    require(globalConfigs_[_globalConfigID].maxNumResales > 0, "Cannot unlock for resale because resale configuration has not been setup.");
    resellable_ = true;
    currGlobalConfigID_ = _globalConfigID;
    globalConfigs_[_globalConfigID].locked = true;
    emit ResaleUnlocked(did_);
  }

  function lockResale() public onlyBy(owner_) {
    resellable_ = false;
    emit ResaleLocked(did_);
  }

  function setPrice(uint256 _quantity, uint256 _price) external onlyBy(owner_) {
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

  function removePriceTier(uint256 _quantity) external onlyBy(owner_) {
    delete prices_[_quantity];
    for (uint256 i = 0; i < priceTiers_.length; i++) {
      if (priceTiers_[i] == _quantity) {
        delete priceTiers_[i]; // delete price tier
        priceTiers_[i] = priceTiers_[priceTiers_.length - 1]; // move last price tier into deleted tier position
        delete priceTiers_[priceTiers_.length - 1]; // delete last price tier
      }
    }
  }

  function setMinResalePrice(uint256 _configID, uint256 _price) external onlyBy(owner_) {
    require(!globalConfigs_[_configID].locked, "Cannot modify a locked resale configuration.");
    globalConfigs_[_configID].minResalePrice = _price;
    emit MinResalePriceSet(did_, _price);
  }

  function setResaleQuantity(uint256 _configID, uint256 _quantity) external onlyBy(owner_) {
    require(!globalConfigs_[_configID].locked, "Cannot modify a locked resale configuration.");
    globalConfigs_[_configID].maxNumResales = _quantity;
    emit MaxNumResalesSet(did_, _quantity);
  }

  function setSupply(uint256 _quantity) public onlyBy(owner_) {
    require(_quantity > 0, "Quantity must be greater than 0.");

    totalCopies_ = _quantity;
    if (0 != totalCopies_) {
      unlimited_ = false;
    }

    emit SupplySet(did_, totalCopies_);
  }

  function increaseSupply(uint256 _quantity) public onlyBy(owner_) {
    require(_quantity > 0, "Quantity must be greater than 0.");

    totalCopies_ += _quantity;
    if (0 != totalCopies_) {
      unlimited_ = false;
    }

    emit IncreasedSupply(did_, _quantity, totalCopies_);
    emit SupplySet(did_, totalCopies_);
  }

  function decreaseSupply(uint256 _quantity) public onlyBy(owner_) {
    require(_quantity > 0, "Cannot remove non-positive number of copies.");
    require(totalCopies_ > 0, "Cannot remove anymore copies.");
    require(totalCopies_ - _quantity >= 0, "Trying to remove more copies than already exist.");

    totalCopies_ -= _quantity;
    if (0 != totalCopies_) {
      unlimited_ = false;
    }

    emit DecreasedSupply(did_, _quantity, totalCopies_);
    emit SupplySet(did_, totalCopies_);
  }

  function setUnlimitedSupply() public onlyBy(owner_) {
    totalCopies_ = 0;
    unlimited_ = true;
    emit SupplySet(did_, totalCopies_);
  }

  function setRoyalties(bytes32[] _hashedAddresses, uint256[] _amounts) public onlyBy(owner_) {
    require(priceTiers_.length > 0, "Price must be set prior to setting royalties.");

    if(royalties_.hashedAddresses.length > 0) {
      for(uint256 i = 0; i < royalties_.hashedAddresses.length; i++) {
        royalties_.split[royalties_.hashedAddresses[i]] = 0;
      }
      delete royalties_.hashedAddresses;
    }

    uint256 profit = 0;
    for(uint256 j = 0; j < _hashedAddresses.length; j++) {
      royalties_.split[_hashedAddresses[j]] = _amounts[j];
      royalties_.hashedAddresses.push(_hashedAddresses[j]);
      profit += _amounts[j];
    }

    require(profit <= royaltyMultiplier, "Royalty splits cannot exceed 100%.");
    royalties_.ownerProfit = royaltyMultiplier - profit;
  }

  function getRoyalty(bytes32 hashedAddress) public view returns (uint256) {
    if(royalties_.hashedAddresses.length == 0) {
      return 0;
    } else {
      return royalties_.split[hashedAddress];
    }
  }

  function getOwnerProfit() public view returns (uint256) {
    if(royalties_.hashedAddresses.length == 0) {
      return royaltyMultiplier;
    } else {
      return royalties_.ownerProfit;
    }
  }

/**
 * RESELLER COMMERCE
 * ===============================================================================================
 */

  function unlockResaleQuantity(uint256 _configID, uint256 _quantity) public purchaseRequired {
    require(globalConfigs_[_configID].maxNumResales > 0, "Not a valid resale configuration.");
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require(_quantity + purchases_[hashedAddress].configs[_configID].available <= purchases_[hashedAddress].configs[_configID].quantity, "Cannot unlock more for resale than owned.");
    purchases_[hashedAddress].configs[_configID].available += _quantity;
    assert(purchases_[hashedAddress].configs[_configID].available <= purchases_[hashedAddress].configs[_configID].quantity);
    emit ResaleUnlocked(did_, msg.sender, purchases_[hashedAddress].configs[_configID].available);
  }

  function lockResaleQuantity(uint256 _configID, uint256 _quantity) public purchaseRequired {
    require(globalConfigs_[_configID].maxNumResales > 0, "Not a valid resale configuration.");
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require(purchases_[hashedAddress].configs[_configID].available >= _quantity, "Cannot lock more than is available for resale.");
    purchases_[hashedAddress].configs[_configID].available -= _quantity;
    assert(purchases_[hashedAddress].configs[_configID].available <= purchases_[hashedAddress].configs[_configID].quantity);
    emit ResaleLocked(did_, msg.sender, purchases_[hashedAddress].configs[_configID].available);
  }

  function setResalePrice(uint256 _configID, uint256 _price) external purchaseRequired {
    require(globalConfigs_[_configID].maxNumResales > 0, "Not a valid resale configuration.");
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require(_price >= globalConfigs_[_configID].minResalePrice, "Resale price must be at least the minimum resale price.");
    purchases_[hashedAddress].configs[_configID].resalePrice = _price;
    emit ResalePriceSet(did_, msg.sender, _price);
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
    require(listed_, "AFS has not been listed for sale.");
    require(totalCopies_ != 0 || unlimited_, "No more copies available for purchase.");
    require(_quantity > 0, "Must purchase at least 1 copy.");
    require(totalCopies_ >= _quantity || unlimited_, "Cannot purchase more copies than are available.");

    uint256 allowance = token_.allowance(msg.sender, address(this));
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    uint256 totalPrice = _quantity * getPrice(_quantity);
    require(allowance >= (totalPrice) + _budget, "Proxy must be approved for purchase.");

    if(royalties_.hashedAddresses.length == 0) {
      require(token_.transferFrom(msg.sender, owner_, totalPrice), "Ara transfer failed.");
    } else {  
      // TODO temporary
      uint256[] amounts;
      uint256[] profits;

      // amounts becomes any integer less than 10,000 where 10,000 = 100%
      for(uint256 i = 0; i < royalties_.hashedAddresses.length; i++) {
        hashedAddress = royalties_.hashedAddresses[i];
        uint256 amount = royalties_.split[hashedAddress];
        amounts.push(amount);
        uint256 profit = totalPrice * ((royaltyMultiplier / amount) + (royaltyMultiplier % amount));
        profits.push(profit);
        rewards_[hashedAddress] += profit;
      }
      emit RoyaltiesPaidOut(royalties_.hashedAddresses, amounts, totalPrice, profits);
      // TODO pay out owner
    }

    if (resellable_) {
      if (purchases_[hashedAddress].configs[currGlobalConfigID_].enabled) {
        purchases_[hashedAddress].configs[currGlobalConfigID_].quantity += _quantity;
      } else {
        ResaleConfig memory config;
        config.resalePrice = globalConfigs_[currGlobalConfigID_].minResalePrice;
        config.quantity = _quantity;
        config.enabled = true;

        purchases_[hashedAddress].configIDIndices[currGlobalConfigID_] = purchases_[hashedAddress].configIDs.length;
        purchases_[hashedAddress].configIDs.push(currGlobalConfigID_);
        purchases_[hashedAddress].configs[currGlobalConfigID_] = config;
      }
    } else {
      purchases_[hashedAddress].quantity += _quantity;
    }

    if (totalCopies_ > 0) {
      totalCopies_ -= _quantity;
      if (totalCopies_ == 0) {
        unlist();
      }
    }

    if (!lib_.owns(_purchaser, did_)) {
      lib_.addLibraryItem(_purchaser, did_);
    }

    emit Purchased(_purchaser, did_, _quantity, totalPrice, currGlobalConfigID_);

    if (_jobId != bytes32(0) && _budget > 0) {
      submitBudget(_jobId, _budget);
    }
  }

  /**
   * @param _seller seller's Ethereum address
   * 
   */
  function purchaseResale(address _seller, uint256 _configID, bytes32 _purchaser, uint256 _quantity, bytes32 _jobId, uint256 _budget) external {
    require(_quantity > 0, "Must purchase at least 1 copy.");
    bytes32 seller = keccak256(abi.encodePacked(_seller));
    ResaleConfig storage sellerConfig = purchases_[seller].configs[_configID];

    require(sellerConfig.enabled, "Please provide a valid seller resale configuration.");
    require(sellerConfig.available >= _quantity, "This quantity is not available for resale from this seller using this resale configuration.");
    require(sellerConfig.resales[_quantity - 1] < globalConfigs_[_configID].maxNumResales, "Copy has already been sold the maximum number of times.");

    uint256 totalPrice = _quantity * sellerConfig.resalePrice;
    require(token_.allowance(msg.sender, address(this)) >= totalPrice + _budget, "Proxy must be approved for purchase.");

    // transfer minimum resale price to owner and transfer remainder to reseller
    require(token_.transferFrom(msg.sender, _seller, _quantity * (sellerConfig.resalePrice - globalConfigs_[_configID].minResalePrice))
      && token_.transferFrom(msg.sender, owner_, _quantity * globalConfigs_[_configID].minResalePrice), "Ara transfer failed.");
    
    // decrement seller resale availability/quantity
    sellerConfig.quantity -= _quantity;
    sellerConfig.available -= _quantity;

    bytes32 purchaser = keccak256(abi.encodePacked(msg.sender));
    Purchases storage purchaserPurchases = purchases_[purchaser];

    if (purchaserPurchases.configs[_configID].enabled) {
      purchaserPurchases.configs[_configID].quantity += _quantity;
    } else {
      _createConfig(purchaser, _configID, _quantity, sellerConfig);
    }

    if (!lib_.owns(_purchaser, did_)) {
      lib_.addLibraryItem(_purchaser, did_);
    }

    emit PurchasedResale(_purchaser, _seller, did_, _quantity, totalPrice, _configID);

    if (sellerConfig.quantity == 0) {
      _deleteConfig(seller, _configID, seller);
    }

    if (_jobId != bytes32(0) && _budget > 0) {
      submitBudget(_jobId, _budget);
    }
  }

  function _createConfig(bytes32 _owner, uint256 _id, uint256 _quantity, ResaleConfig storage oldConfig) internal {
    ResaleConfig memory newConfig;

    newConfig.resalePrice = globalConfigs_[_id].minResalePrice;
    newConfig.quantity = _quantity;
    newConfig.enabled = true;

    Purchases storage purchases = purchases_[_owner];

    purchases.configIDIndices[_id] = purchases_[_owner].configIDs.length;
    purchases.configIDs.push(_id);
    purchases.configs[_id] = newConfig;

    uint256 soldCopyIndex;
    for (uint256 i = 0; i < _quantity; i++) {
      soldCopyIndex = i + oldConfig.quantity;
      purchases.configs[_id].resales.push(oldConfig.resales[soldCopyIndex] + 1); // update resale count for purchaser with old resale count + 1
      delete oldConfig.resales[soldCopyIndex]; // delete resale count for sold copies
    }
  }

  function _deleteConfig(bytes32 seller, uint256 _id, bytes32 _seller) internal {
    // delete config
    Purchases storage sellerPurchases = purchases_[_seller];
    delete sellerPurchases.configs[_id]; // delete config mapping
    uint256 configIDIndex = sellerPurchases.configIDIndices[_id]; // get configID index
    delete sellerPurchases.configIDIndices[_id]; // delete configID index mapping
    sellerPurchases.configIDs[configIDIndex] = sellerPurchases.configIDs[sellerPurchases.configIDs.length - 1]; // move last configID into deleted configID position
    delete sellerPurchases.configIDs[sellerPurchases.configIDs.length - 1]; // delete last configID

    if (sellerPurchases.configIDs.length == 0) {
      lib_.removeLibraryItem(seller, did_);
    }
  }

  function getResaleConfig(bytes32 _owner, uint256 _id) public view returns (uint256 minResalePrice, uint256 maxNumResales, uint256 resalePrice, uint256 available, uint256 quantity) {
    ResaleConfig storage config = purchases_[_owner].configs[_id];
    return (globalConfigs_[_id].minResalePrice, globalConfigs_[_id].maxNumResales, config.resalePrice, config.available, config.quantity);
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
    bytes _msBuffer, bool _list) external onlyBy(owner_) {
    
    listed_ = listed_ || _list;

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
    bytes _msBuffer, bool _list) public onlyBy(owner_) {

    listed_ = listed_ || _list;

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
}
