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

  string   public did_;
  bool     public listed_;
  uint256  public price_;

  mapping(bytes32 => uint256) public rewards_;
  mapping(bytes32 => bool)    public purchasers_;
  mapping(uint8 => Buffers) public metadata_;

  struct Buffers {
    mapping (uint256 => bytes) buffers;
    bool invalid;
  }

  event Commit(string _did);
  event Unlisted(string _did);
  event PriceSet(string _did, uint256 _price);
  event RewardDeposited(string _did, uint256 _reward);
  event RewardDistributed(string _did, uint256 _distributed, uint256 _returned);
  event Purchased(string _purchaser, string _did, bool _download);

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
    owner_    = msg.sender;
    _data;
    uint256 btsptr;
    /* solium-disable-next-line security/no-inline-assembly */
    address tokenAddr;
    address libAddr;
    assembly {
        btsptr := add(_data, /*BYTES_HEADER_SIZE*/32)
        tokenAddr := mload(btsptr)
        btsptr := add(_data, /*BYTES_HEADER_SIZE*/64)
        libAddr := mload(btsptr)
    }
    token_    = ARAToken(tokenAddr);
    lib_      = Library(libAddr);
    listed_   = true;
    price_    = 0;
  }

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

  function purchase(string _purchaser, bool _download) external returns (bool success) {
    uint256 allowance = token_.allowance(msg.sender, address(this));
    require (allowance >= price_); // check if purchaser approved purchase

    if (token_.transferFrom(msg.sender, owner_, price_)) {
      bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
      purchasers_[hashedAddress] = true;
      lib_.addLibraryItem(_purchaser, did_);
      emit Purchased(_purchaser, did_, _download);

      if (_download && allowance > price_) {
        depositReward(allowance - price_);
      }

      return true;
    } else {
      return false;
    }
  }

  function append(uint256[] _mtOffsets, uint256[] _msOffsets, bytes _mtBuffer, 
    bytes _msBuffer) external onlyBy(owner_) {
    
    require(!metadata_[0].invalid);
    
    uint256 maxOffsetLength = _mtOffsets.length > _msOffsets.length ? _mtOffsets.length : _msOffsets.length;

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

  function write(uint256[] _mtOffsets, uint256[] _msOffsets, uint8[] _mtSizes,
    uint8[] _msSizes, bytes _mtBuffer, bytes _msBuffer) public onlyBy(owner_) {

    require(!metadata_[0].invalid);
    require(_mtOffsets.length == _mtSizes.length && _msOffsets.length == _msSizes.length);

    uint256 maxOffsetLength = _mtOffsets.length > _msOffsets.length ? _mtOffsets.length : _msOffsets.length;

    for (uint i = 0; i < maxOffsetLength; i++) {
      // metadata/tree
      if (i <= _mtOffsets.length - 1) {
        metadata_[0].buffers[_mtOffsets[i]] = _mtBuffer.slice(_mtOffsets[i], _mtSizes[i]);
      }
      
      // metadata/signatures
      if (i <= _msOffsets.length - 1) {
        metadata_[1].buffers[_msOffsets[i]] = _msBuffer.slice(_msOffsets[i], _msSizes[i]);
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
