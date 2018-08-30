pragma solidity ^0.4.24;

import "./StandardToken.sol";

contract ARAToken is StandardToken {

  // metadata
  string  public constant name = "ARA Token";
  string  public constant symbol = "ARA";
  uint256 public constant decimals = 18;
  string  public version = "1.0";

  // constructor
  constructor() public {
    _mint(msg.sender, formatDecimals(1000000000)); // 1,000,000,000
  }

  function formatDecimals(uint256 _value) internal pure returns (uint256) {
      return _value * 10 ** decimals;
  }

}
