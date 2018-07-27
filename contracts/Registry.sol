pragma solidity 0.4.24;

contract Registry {
  address public owner_;
  mapping (string => address) private proxies_; // contentId => proxy contract address
  address public standard_;
  string public version_;

  constructor() public {
    owner = msg.sender;
  }

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function getProxyAddress(string _contentId) external returns (address) {
    return proxies_[_contentId];
  }

  function addProxyAddress(string _contentId, address _address) public {
    Proxy proxy = Proxy(_address);
    address standard = proxy.implementation();
    assert(standard == standard_);
    proxies_[contentId] = _address;
  }

  function addStandardVersion(string _version, address _address) public restricted {
    standard_ = _address;
    version_ = _version;
  }
}
