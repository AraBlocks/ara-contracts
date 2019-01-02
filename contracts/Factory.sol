pragma solidity ^0.4.24;

contract Factory {
  event ContractDeployed(string label, address deployedAddress);

  function deploy(string _label, bytes _bytes) public returns (address deployedAddress) {
    assembly {
      deployedAddress := create(0, add(_bytes, 0x20), mload(_bytes))
    }
    emit ContractDeployed(_label, deployedAddress);
  }
}
