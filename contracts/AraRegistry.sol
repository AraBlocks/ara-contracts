pragma solidity ^0.4.24;

import "./AraProxy.sol";//whats the diff between this contract and `Registry`?

contract AraRegistry {
  address public owner_;
  mapping (bytes32 => UpgradeableContract) private contracts_; // keccak256(contractname) => struct

  struct UpgradeableContract {
    bool initialized_;

    address proxy_;
    string latestVersion_;
    mapping (string => address) versions_;
  }

  event UpgradeableContractAdded(bytes32 _contractName, string _version, address _address);
  event ContractUpgraded(bytes32 _contractName, string _version, address _address);
  event ProxyDeployed(bytes32 _contractName, address _address);

  constructor() public {
    owner_ = msg.sender;
  }

  modifier restricted() {
    require (
      msg.sender == owner_,
      "Sender not authorized."
    );
    _;
  }

  function getLatestVersionAddress(bytes32 _contractName) public view returns (address) {
    return contracts_[_contractName].versions_[contracts_[_contractName].latestVersion_];
  }

  function getUpgradeableContractAddress(bytes32 _contractName, string _version) public view returns (address) {
    return contracts_[_contractName].versions_[_version];
  }

  function addNewUpgradeableContract(bytes32 _contractName, string _version, bytes _code, bytes _data) public restricted {
    require(!contracts_[_contractName].initialized_, "Upgradeable contract already exists. Try upgrading instead.");
    address deployedAddress;
    assembly {
      deployedAddress := create(0, add(_code, 0x20), mload(_code))
    }

    contracts_[_contractName].initialized_ = true;
    contracts_[_contractName].latestVersion_ = _version;
    contracts_[_contractName].versions_[_version] = deployedAddress;
    _deployProxy(_contractName, deployedAddress, _data);

    emit UpgradeableContractAdded(_contractName, _version, deployedAddress);
  }

  function upgradeContract(bytes32 _contractName, string _version, bytes _code) public restricted {
    require(contracts_[_contractName].initialized_, "Upgradeable contract must exist before it can be upgraded. Try adding one instead.");
    address deployedAddress;
    assembly {
      deployedAddress := create(0, add(_code, 0x20), mload(_code))
    }

    AraProxy proxy = AraProxy(contracts_[_contractName].proxy_);
    proxy.setImplementation(deployedAddress);

    contracts_[_contractName].latestVersion_ = _version;
    contracts_[_contractName].versions_[_version] = deployedAddress;

    emit ContractUpgraded(_contractName, _version, deployedAddress);
  }

  function _deployProxy(bytes32 _contractName, address _implementationAddress, bytes _data) private {
    require(contracts_[_contractName].proxy_ == address(0), "Only one proxy can exist per upgradeable contract.");
    AraProxy proxy = new AraProxy(address(this), _implementationAddress);
    require(address(proxy).call(abi.encodeWithSignature("init(bytes)", _data)), "Init failed.");
    contracts_[_contractName].proxy_ = proxy;

    emit ProxyDeployed(_contractName, proxy);
  }
}
