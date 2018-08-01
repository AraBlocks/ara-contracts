pragma solidity 0.4.24;

import "./Proxy.sol";
import "./OwnedUpgradabilityProxy.sol";

contract Registry {
  address public owner_;
  mapping (string => address) private proxies_; // contentId => proxy
  mapping (string => address) private proxyOwners_; // contentId => owner
  mapping (string => address) public versions_; // version => implementation
  mapping (address => address) public proxyImpls_; // proxy => implementation

  constructor() public {
    owner_ = msg.sender;
  }

  modifier restricted() {
    require (msg.sender == owner_);
     _;
  }

  modifier onlyProxyOwner(string _contentId) {
    require(proxyOwners_[_contentId] == msg.sender):
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
    OwnedUpgradabilityProxy proxy = new OwnedUpgradabilityProxy(address(this));
    upgradeProxy(_contentId, _version);
    proxy.init(_data);
    proxies_[_contentId] = proxy;
    proxyOwners_[_contentId] = msg.sender;
  }

  /**
   * @dev Upgrades proxy implementation version
   * @param _contentId The methodless content DID
   * @param _version The implementation version to upgrade this Proxy to
   */
  function upgradeProxy(string _contentId, string _version) public onlyProxyOwner(_contentId) {
    require(versions_[_version] != address(0));
    Proxy proxy = Proxy(proxies_[_contentId]);
    proxy.upgradeTo(versions_[_version]);
    proxyImpls_[proxy] = versions_[_version];
  }

  /**
   * @dev Upgrades proxy implementation version with initialization
   * @param _contentId The methodless content DID
   * @param _version The implementation version to upgrade this Proxy to
   * @param _data AFS initialization data
   */
  function upgradeProxyAndCall(string _contentId, string _version, bytes data) public onlyProxyOwner(_contentId) {
    require(versions_[_version] != address(0));
    Proxy proxy = Proxy(proxies_[_contentId]);
    proxy.upgradeToAndCall(versions_[_version], data);
    proxyImpls_[proxy] = versions_[_version];
  }

  function addStandardVersion(string _version, address _address) public restricted {
    versions_[_version] = _address;
  }
}
