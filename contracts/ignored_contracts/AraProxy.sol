pragma solidity ^0.4.24;

import "../AraRegistry.sol";

/**
 * @title AraProxy
 * @dev Gives the possibility to delegate any call to a foreign implementation.
 */
contract AraProxy {

  bytes32 private constant storagePosition_ = keccak256("io.ara.proxy.storage");
  // bytes32 private constant contractNamePosition_ = keccak256("io.ara.proxy.contractName");

  /**
  * @dev the constructor sets the AraRegistry address
  */
  constructor(address _registryAddress, string _contractName) public {
    bytes32 storagePosition = storagePosition_;
    // bytes32 contractNamePosition = contractNamePosition_;
    assembly {
      sstore(storagePosition, _registryAddress)
      // sstore(contractNamePosition, _contractName)
    }
  }

  /**
  * @dev Fallback function allowing to perform a delegatecall to the given implementation.
  * This function will return whatever the implementation call returns
  */
  function () payable public {
    bytes32 storagePosition = storagePosition_;
    // bytes32 contractNamePosition = contractNamePosition_;

    address registryAddress;
    // string memory contractName;
    assembly {
      registryAddress := sload(storagePosition)
      // contractName := sload(contractNamePosition)
    }
    AraRegistry reg = AraRegistry(registryAddress);
    address _impl = reg.getLatestVersionAddress('Registry.sol:Registry');
    
    require(_impl != address(0));

    assembly {
      let ptr := mload(0x40)
      calldatacopy(ptr, 0, calldatasize)
      let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
      let size := returndatasize
      returndatacopy(ptr, 0, size)

      switch result
      case 0 { revert(ptr, size) }
      default { return(ptr, size) }
    }
  }
}
