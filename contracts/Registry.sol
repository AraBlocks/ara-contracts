pragma solidity 0.4.24;

import "./Proxy.sol";

contract Registry {
  address public owner_;
  mapping (bytes32 => address) private proxies_; // hash(contentId) => proxy
  mapping (bytes32 => address) private proxyOwners_; // hash(contentId) => owner
  mapping (string => address) private versions_; // version => implementation
  mapping (address => address) public proxyImpls_; // proxy => implementation
  string public latestVersion_;

  event ProxyDeployed(bytes32 _contentId, address _address);
  event ProxyUpgraded(bytes32 _contentId, string _version);
  event StandardAdded(string _version, address _address);

  constructor() public {
    owner_ = msg.sender;
  }

  modifier restricted() {
    require (msg.sender == owner_);
     _;
  }

  modifier onlyProxyOwner(bytes32 _contentId) {
    require(proxyOwners_[_contentId] == msg.sender);
    _;
  }

  function getProxyAddress(bytes32 _contentId) external view returns (address) {
    return proxies_[_contentId];
  }

  function getProxyOwner(bytes32 _contentId) external view returns (address) {
    return proxyOwners_[_contentId];
  }

  function getImplementation(string _version) external view returns (address) {
    return versions_[_version];
  }

  /**
   * @dev AFS Proxy Factory
   * @param _contentId The hashed methodless content DID
   * @param _version The implementation version to use with this Proxy
   * @param _data AFS initialization data
   * @return address of the newly deployed Proxy
   */
  function createAFS(bytes32 _contentId, string _version, bytes _data) public {
    require(proxies_[_contentId] == address(0));
    Proxy proxy = new Proxy(address(this));
    proxies_[_contentId] = proxy;
    proxyOwners_[_contentId] = msg.sender;
    upgradeProxyAndCall(_contentId, _version, _data);
    emit ProxyDeployed(_contentId, address(proxy));
  }

  /**
   * @dev Upgrades proxy implementation version
   * @param _contentId The methodless content DID
   * @param _version The implementation version to upgrade this Proxy to
   */
  function upgradeProxy(bytes32 _contentId, string _version) public onlyProxyOwner(_contentId) {
    require(versions_[_version] != address(0));
    proxyImpls_[proxies_[_contentId]] = versions_[_version];
    emit ProxyUpgraded(_contentId, _version);
  }

  /**
   * @dev Upgrades proxy implementation version with initialization
   * @param _contentId The methodless content DID
   * @param _version The implementation version to upgrade this Proxy to
   * @param _data AFS initialization data
   */
  function upgradeProxyAndCall(bytes32 _contentId, string _version, bytes _data) public onlyProxyOwner(_contentId) {
    require(versions_[_version] != address(0));
    Proxy proxy = Proxy(proxies_[_contentId]);
    proxyImpls_[proxy] = versions_[_version];
    if(!address(proxy).call(abi.encodeWithSignature("init(bytes)", _data))) revert();
    emit ProxyUpgraded(_contentId, _version);
  }

  /**
   * @dev Adds a new AFS implementation standard
   * @param _version The implementation version name
   * @param _address The address of the new AFS implementation
   */
  function addStandardVersion(string _version, address _address) public restricted {
    require(versions_[_version] == address(0));
    versions_[_version] = _address;
    latestVersion_ = _version;
    emit StandardAdded(_version, _address);
  }
}
