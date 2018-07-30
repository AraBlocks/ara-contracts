pragma solidity 0.4.24;

import "./Proxy.sol";

contract Registry {
  address public owner_;
  mapping (string => address) private proxies_; // contentId => proxy contract address
  address public standard_;
  string public version_;

  constructor() public {
    owner_ = msg.sender;
  }

  modifier restricted() {
    if (msg.sender == owner_) _;
  }

  modifier onlyProxyOwner(string _contentId, address _address) {
    address oldProxyAddress = proxies_[_contentId];
    Proxy oldProxy = Proxy(oldProxyAddress);
    Proxy newProxy = Proxy(_address);
    if (newProxy.owner_() == msg.sender && (oldProxyAddress == address(0) || oldProxy.owner_() == newProxy.owner_())) _;
  }

  function getProxyAddress(string _contentId) external view returns (address) {
    return proxies_[_contentId];
  }

  function addProxyAddress(string _contentId, address _address) public onlyProxyOwner(_contentId, _address) {
    Proxy proxy = Proxy(_address);
    address standard = proxy.implementation(); // call
    assert(standard == standard_);
    proxies_[_contentId] = _address;
  }

  function addStandardVersion(string _version, address _address) public restricted {
    standard_ = _address;
    version_ = _version;
  }
}
