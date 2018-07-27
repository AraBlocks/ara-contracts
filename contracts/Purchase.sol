pragma solidity ^0.4.24;

import './ARAToken.sol';
import './Library.sol';

contract Purchase {

  address public owner;
  Price p;
  Library lib;
  ARAToken token;

  event LogPurchased(string _identity);

  constructor() public {
    owner = msg.sender;
  }

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function setTokenAddress(address _token) public restricted {
    token = ARAToken(_token);
  }

  function setDelegateAddresses(address _price, address _lib) public restricted {
    p = Price(_price);
    lib = Library(_lib);
  }

  function purchase(string identity, string contentId, string hContentId, uint16 cost) public {
    uint16 price = p.getPrice(hContentId);
    require (price == cost);
    // call ARA token contract transfer() function with cost
    lib.addLibraryItem(identity, contentId);
    emit LogPurchased(contentId);
  }

}

contract Price {
  function getPrice(string identity) public view returns (uint16 price);
}
