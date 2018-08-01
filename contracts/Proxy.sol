pragma solidity ^0.4.24;

import './Registry.sol';

/**
 * @title Proxy
 * @dev Gives the possibility to delegate any call to a foreign implementation.
 */
contract Proxy {

  bytes32 private constant registryPosition = keccak256("io.arablocks.proxy.registry");

  /**
  * @dev the constructor sets the registry address
  */
  constructor(address registry) public {
    bytes32 position = registryPosition;
    assembly {
      sstore(position, registry)
    }
  }

  /**
  * @dev Fallback function allowing to perform a delegatecall to the given implementation.
  * This function will return whatever the implementation call returns
  */
  function () payable public {
    bytes32 position = registryPosition;
    address registry;
    assembly {
      registry := sload(position)
    }
    Registry reg = Registry(registry);
    address _impl = reg.proxyImpls_(address(this));
    
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
