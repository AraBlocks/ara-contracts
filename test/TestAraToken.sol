pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/AraToken.sol";

contract TestAraToken {
  function testInitialTotalSupply() public {
    AraToken ara = AraToken(DeployedAddresses.AraToken());

    uint256 expected = 1000000000000000000000000000;

    Assert.equal(ara.balanceOf(tx.origin), expected, "Owner should have 1000000000000000000000000000 Ara initially");
  }
}
