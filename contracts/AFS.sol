pragma solidity ^0.4.24;

import "./Library.sol";
import "./ARAToken.sol";
import "bytes/BytesLib.sol";

contract AFS {

  using BytesLib for bytes;

  address  public owner_;
  string   public version_ = "1";

  ARAToken public token_;
  Library  public lib_;

  bytes32  public did_;
  bool     public listed_;
  uint256  public price_;

  mapping(bytes32 => uint256) public rewards_;
  mapping(bytes32 => bool)    public purchasers_; // keccak256 hashes of buyer addresses
  mapping(uint8 => Buffers) public metadata_;

  struct Buffers {
    mapping (uint256 => bytes) buffers;
    bool invalid;
  }

  event Commit(bytes32 _did);
  event Unlisted(bytes32 _did);
  event PriceSet(bytes32 _did, uint256 _price);
  event RewardDeposited(bytes32 _did, uint256 _reward);
  event RewardDistributed(bytes32 _did, uint256 _distributed, uint256 _returned);
  event Purchased(string _purchaser, bytes32 _did, bool _download);
  event TEST(address _sender);

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
    owner_    = ownerAddr;
    token_    = ARAToken(tokenAddr);
    lib_      = Library(libAddr);
    did_      = did;
    listed_   = true;
    price_    = 0;
  }

  // tested
  function setPrice(uint256 _price) external onlyBy(owner_) {
    price_ = _price;
    emit PriceSet(did_, price_);
  }

  function depositReward(uint256 _reward) public returns (bool success) {
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    if (purchasers_[hashedAddress]) {
      uint256 allowance = token_.allowance(msg.sender, address(this));
      if (allowance >= _reward 
        && token_.transferFrom(msg.sender, address(this), _reward)) {
        rewards_[hashedAddress] += _reward;
        assert(rewards_[hashedAddress] <= token_.balanceOf(address(this)));
        emit RewardDeposited(did_, _reward);
        return true;
      }
    }
    return false;
  }

  function distributeReward(address[] _addresses, uint256[] _amounts) external returns (bool success) {
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require(rewards_[hashedAddress] > 0 && _addresses.length == _amounts.length);

    uint256 totalRewards;
    for (uint256 i = 0; i < _amounts.length; i++) {
      totalRewards += _amounts[i];
    }
    require(rewards_[hashedAddress] <= token_.balanceOf(address(this)) 
      && rewards_[hashedAddress] >= totalRewards);

    success = true;
    for (uint256 j = 0; j < _addresses.length; j++) {
      bool transferred = token_.transferFrom(address(this), _addresses[j], _amounts[j]);
      if (transferred) {
        rewards_[hashedAddress] -= _amounts[j];
      }
      success = success && transferred;
    }

    uint256 returned = 0;
    if (rewards_[hashedAddress] > 0 
      && token_.transferFrom(address(this), msg.sender, rewards_[hashedAddress])) {
      returned = rewards_[hashedAddress];
      rewards_[hashedAddress] = 0;
    }

    emit RewardDistributed(did_, totalRewards - returned, returned);

    return success;
  }

  /**
   * @dev Purchases this AFS and adds it to _purchaser's library. 
   *      If _download is true, deposits any remaining allowance 
   *      as rewards for this purchase
   * @param _purchaser The hashed methodless did of the purchaser
   * @param _download Whether to deposit additional allowance as rewards
   */
  function purchase(string _purchaser, bool _download) external {
    // address(this) == proxy address
    uint256 allowance = token_.allowance(msg.sender, address(this));
    require (allowance >= price_);
    if (token_.transferFrom(msg.sender, owner_, price_)) {
      // bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
      // purchasers_[hashedAddress] = true;
      // lib_.addLibraryItem(_purchaser, did_);
      emit Purchased(_purchaser, did_, _download);

      // if (_download && allowance > price_) {
      //   depositReward(allowance - price_);
      // }
    }

    //   return true;
    // } else {
    //   return false;
    // }
  }

  function append(uint256[] _mtOffsets, uint256[] _msOffsets, bytes _mtBuffer, 
    bytes _msBuffer) external onlyBy(owner_) {
    
    require(!metadata_[0].invalid);
    
    uint256 maxOffsetLength = _mtOffsets.length > _msOffsets.length 
      ? _mtOffsets.length 
      : _msOffsets.length;

    for (uint i = 0; i < maxOffsetLength; i++) {
      // metadata/tree
      if (i <= _mtOffsets.length - 1) {
        metadata_[0].buffers[_mtOffsets[i]] = _mtBuffer.slice(i * mtBufferSize_, mtBufferSize_);
      }

      // metadata/signatures
      if (i <= _msOffsets.length - 1) {
        metadata_[1].buffers[_msOffsets[i]] = _msBuffer.slice(i * msBufferSize_, msBufferSize_);
      }
    }

    emit Commit(did_);
  }

  function write(uint256[] _mtOffsets, uint256[] _msOffsets, bytes _mtBuffer, 
    bytes _msBuffer) public onlyBy(owner_) {

    require(!metadata_[0].invalid);

    uint256 maxOffsetLength = _mtOffsets.length > _msOffsets.length 
      ? _mtOffsets.length 
      : _msOffsets.length;

    // add headers
    metadata_[0].buffers[0] = _mtBuffer.slice(0, 32);
    metadata_[1].buffers[1] = _msBuffer.slice(0, 32);

    for (uint i = 1; i < maxOffsetLength; i++) {
      // metadata/tree
      if (i <= _mtOffsets.length - 1) {
        metadata_[0].buffers[_mtOffsets[i]] = _mtBuffer.slice(_mtOffsets[i], mtBufferSize_);
      }
      
      // metadata/signatures
      if (i <= _msOffsets.length - 1) {
        metadata_[1].buffers[_msOffsets[i]] = _msBuffer.slice(_msOffsets[i], msBufferSize_);
      }
    }

    emit Commit(did_);
  }

  function read(uint8 _file, uint256 _offset) public view returns (bytes buffer) {
    if (metadata_[_file].invalid) {
      return ""; // empty bytes
    }
    return metadata_[_file].buffers[_offset];
  }

  function hasBuffer(uint8 _file, uint256 _offset, bytes _buffer) public view returns (bool exists) {
    return metadata_[_file].buffers[_offset].equal(_buffer);
  }

  function unlist() public onlyBy(owner_) returns (bool success) {
    metadata_[0].invalid = true;
    metadata_[1].invalid = true;
    listed_ = false;
    emit Unlisted(did_);
    return true;
  }
}
