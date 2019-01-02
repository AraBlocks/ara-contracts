pragma solidity ^0.4.24;

contract AraFactory {
  event ContractDeployed(string _label, address _deployedAddress);

  function deployContract(string label, bytes _code) public returns (address deployedAddress) {
    assembly {
      deployedAddress := create(0, add(_code, 0x20), mload(_code))
    }
    //deployedAddress = address(0);
    emit ContractDeployed(label, deployedAddress);
  }
}
