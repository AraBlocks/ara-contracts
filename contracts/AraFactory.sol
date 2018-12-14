pragma solidity ^0.4.24;

contract AraFactory {
  event ContractDeployed(address _deployedAddress);

  function deployContract(bytes _code) returns (address deployedAddress) {
    assembly {
      deployedAddress := create(0, add(_code, 0x20), mload(_code))
      jumpi(invalidJumpLabel, iszero(extcodesize(deployedAddress))) // jumps if no code at addresses
    }
    ContractDeployed(deployedAddress);
  }
}
