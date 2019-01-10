pragma solidity ^0.4.24;

import "./ignored_contracts/AraProxy.sol";

contract AraRegistry {
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

  function getLatestVersionAddress(bytes32 _contractName) public view returns (address) {
    return contracts_[_contractName].versions_[contracts_[_contractName].latestVersion_];
  }

  function getUpgradeableContractAddress(bytes32 _contractName, string _version) public view returns (address) {
    return contracts_[_contractName].versions_[_version];
  }

  function addNewUpgradeableContract(bytes32 _contractName, string _version, bytes _code, bytes _data) public {
    require(!contracts_[_contractName].initialized_, "Upgradeable contract already exists. Try upgrading instead.");
    address deployedAddress;
    assembly {
      deployedAddress := create(0, add(_code, 0x20), mload(_code))
    }

    contracts_[_contractName].initialized_ = true;
    contracts_[_contractName].latestVersion_ = _version;
    contracts_[_contractName].versions_[_version] = deployedAddress;
    _deployProxy(_contractName, _data);

    emit UpgradeableContractAdded(_contractName, _version, deployedAddress);
  }

  function upgradeContract(bytes32 _contractName, string _version, bytes _code) public {
    require(contracts_[_contractName].initialized_, "Upgradeable contract must exist before it can be upgrading. Try adding one instead.");
    address deployedAddress;
    assembly {
      deployedAddress := create(0, add(_code, 0x20), mload(_code))
    }

    contracts_[_contractName].latestVersion_ = _version;
    contracts_[_contractName].versions_[_version] = deployedAddress;

    emit ContractUpgraded(_contractName, _version, deployedAddress);
  }

  function _deployProxy(bytes32 _contractName, bytes _data) private {
    require(contracts_[_contractName].proxy_ == address(0), "Only one proxy can exist per upgradeable contract.");
    AraProxy proxy = new AraProxy(address(this), _contractName);
    require(address(proxy).call(abi.encodeWithSignature("init(bytes)", _data)), "Init failed.");
    contracts_[_contractName].proxy_ = proxy;

    emit ProxyDeployed(_contractName, proxy);
  }
}
