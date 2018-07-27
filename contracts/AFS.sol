pragma solidity ^0.4.24;

contract AFSBase {
  address  public owner_;

  string   public version_ = "1";

  ARAToken public token_;
  Library  public lib_;

  string   public did_;
  bool     public listed_;
  uint256  public price_;

  mapping(bytes32 => uint256) internal rewards_;
  mapping(bytes32 => bool) internal purchasers_;

  event Commit(string _did, uint8 _file, uint256 _offset, bytes _buffer);
  event Unlisted(string _did);
  event PriceSet(string _did, uint256 _price);
  event RewardDeposited(string _did, uint256 _reward);
  event RewardDistributed(string _did, uint256 _distributed, uint256 _returned);
  event Purchased(string _purchaser, string _did, bool _download);

  modifier onlyBy(address _account)
  {
      require(
          msg.sender == _account,
          "Sender not authorized."
      );
      _;
  }

  // Storage (random-access-contract)
  mapping(uint8 => Buffers) metadata_;
  struct Buffers {
    mapping (uint256 => bytes) buffers;
    uint256[] offsets;
    bool invalid;
  }

  function setPrice(uint256 _price) external;

  function depositReward(uint256 _reward) public returns (bool success);
  function distributeReward(address[] _address, uint256[] _amounts) external returns (bool success);

  function purchase(string _purchaser, bool _download) external returns (bool success);

  // Storage methods (random-access-contract)
  function write(uint8 _file, uint256 _offset, bytes _buffer, bool _last_write) external returns (bool success);
  function read(uint8 _file, uint256 _offset) public view returns (bytes buffer);
  function unlist() public returns (bool success);
}

contract Library {
  function addLibraryItem(string _identity, string _contentId) public;
}

contract ARAToken {
    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address owner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

contract AFS is AFSBase {

  constructor(address _lib, address _token, string _did) public {
    owner_    = msg.sender;
    token_    = ARAToken(_token);
    lib_      = Library(_lib);
    did_      = _did;
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

  // Storage methods (random-access-contract)
  function write(uint8 _file, uint256 _offset, bytes _buffer, bool _last_write) external onlyBy(owner_) returns (bool success){
    // make sure AFS hasn't been removed
    require(!metadata_[_file].invalid);

    metadata_[_file].buffers[_offset] = _buffer;
    metadata_[_file].offsets.push(_offset);

    if (_last_write) {
      emit Commit(did_, _file, _offset, _buffer);
    }
    return true;
  }

  function read(uint8 _file, uint256 _offset) public view returns (bytes buffer) {
    if (metadata_[_file].invalid) {
      return ""; // empty bytes
    }
    return metadata_[_file].buffers[_offset];
  }

  function unlist() public onlyBy(owner_) returns (bool success) {
    metadata_[0].invalid = true;
    metadata_[1].invalid = true;
    listed_ = false;
    emit Unlisted(did_);
    return true;
  }
}
