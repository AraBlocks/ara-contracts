pragma solidity 0.4.24;

import "./Proxy.sol";

contract Registry {
  address public owner_;
  mapping (string => address) private proxies_; // contentId => proxy
  mapping (string => address) private proxyOwners_; // contentId => owner
  mapping (string => address) private versions_; // version => implementation
  mapping (address => address) public proxyImpls_; // proxy => implementation

  constructor() public {
    owner_ = msg.sender;
  }

  modifier restricted() {
    require (msg.sender == owner_);
     _;
  }

  modifier onlyProxyOwner(string _contentId) {
    require(proxyOwners_[_contentId] == msg.sender);
    _;
  }

  /**
   * @dev AFS Proxy Factory
   * @param _contentId The methodless content DID
   * @param _version The implementation version to use with this Proxy
   * @param _data AFS initialization data
   */
  function createAFS(string _contentId, string _version, bytes _data) public {
    require(proxies_[_contentId] == address(0));
    Proxy proxy = new Proxy(address(this));
    upgradeProxy(_contentId, _version);
    require(address(proxy).call(bytes4(keccak256("init(bytes)")), _data));
    proxies_[_contentId] = proxy;
    proxyOwners_[_contentId] = msg.sender;
  }

  function getProxyAddress(string _contentId) external view returns (address) {
    return proxies_[_contentId];
  }

  function getProxyOwner(string _contentId) external view returns (address) {
    return proxyOwners_[_contentId];
  }

  function getImplementation(string _version) external view returns (address) {
    return versions_[_version];
  }

  /**
   * @dev Upgrades proxy implementation version
   * @param _contentId The methodless content DID
   * @param _version The implementation version to upgrade this Proxy to
   */
  function upgradeProxy(string _contentId, string _version) public onlyProxyOwner(_contentId) {
    require(versions_[_version] != address(0));
    proxyImpls_[proxies_[_contentId]] = versions_[_version];
  }

  /**
   * @dev Upgrades proxy implementation version with initialization
   * @param _contentId The methodless content DID
   * @param _version The implementation version to upgrade this Proxy to
   * @param _data AFS initialization data
   */
  function upgradeProxyAndCall(string _contentId, string _version, bytes _data) public onlyProxyOwner(_contentId) {
    require(versions_[_version] != address(0));
    Proxy proxy = Proxy(proxies_[_contentId]);
    proxyImpls_[proxy] = versions_[_version];
    require(address(proxy).call(bytes4(keccak256("init(bytes)")), _data));
  }

  function addStandardVersion(string _version, address _address) public restricted {
    versions_[_version] = _address;
  }
}
