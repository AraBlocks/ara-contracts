pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/BasicToken.sol';

contract ARAToken is ERC20, BasicToken {
  // metadata
  string  public constant name = "ARA Token";
  string  public constant symbol = "ARA";
  uint256 public constant decimals = 18;
  string  public version = "1.0";

  // format decimals.
  function formatDecimals(uint256 _value) internal pure returns (uint256) {
      return _value * 10 ** decimals;
  }

  // constructor
  constructor() public {
    totalSupply_ = formatDecimals(1000000000); // 1,000,000,000
  }
}
