pragma solidity ^0.4.24;

import "./ignored_contracts/AraProxy.sol";

contract AraRegistry {
  mapping (string => UpgradeableContract) private contracts_; // contract name => struct

  struct UpgradeableContract {
    bool initialized_;

    address proxy_;
    string latestVersion_;
    mapping (string => address) versions_;
  }

  event UpgradeableContractAdded(string _contractName, string _version, address _address);
  event ContractUpgraded(string _contractName, string _version, address _address);
  event ProxyDeployed(string _contractName, address _address);

  function getLatestVersionAddress(string _contractName) public view returns (address) {
    return contracts_[_contractName].versions_[contracts_[_contractName].latestVersion_];
  }

  function getUpgradeableContractAddress(string _contractName, string _version) public view returns (address) {
    return contracts_[_contractName].versions_[_version];
  }

  function addNewUpgradeableContract(string _contractName, string _version, bytes _code) public {
    require(!contracts_[_contractName].initialized_, "Upgradeable contract already exists. Try upgrading instead.");
    address deployedAddress;
    assembly {
      deployedAddress := create(0, add(_code, 0x20), mload(_code))
    }

    contracts_[_contractName].initialized_ = true;
    contracts_[_contractName].latestVersion_ = _version;
    contracts_[_contractName].versions_[_version] = deployedAddress;
    _deployProxy(_contractName);

    emit UpgradeableContractAdded(_contractName, _version, deployedAddress);
  }

  function upgradeContract(string _contractName, string _version, bytes _code) public {
    require(contracts_[_contractName].initialized_, "Upgradeable contract must exist before it can be upgrading. Try adding one instead.");
    address deployedAddress;
    assembly {
      deployedAddress := create(0, add(_code, 0x20), mload(_code))
    }

    contracts_[_contractName].latestVersion_ = _version;
    contracts_[_contractName].versions_[_version] = deployedAddress;

    emit ContractUpgraded(_contractName, _version, deployedAddress);
  }

  function _deployProxy(string _contractName) private {
    require(contracts_[_contractName].proxy_ == address(0), "Only one proxy can exist per upgradeable contract.");
    AraProxy proxy = new AraProxy(address(this), _contractName);
    contracts_[_contractName].proxy_ = proxy;

    emit ProxyDeployed(_contractName, proxy);
  }
}
