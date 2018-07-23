pragma solidity ^0.4.24;

contract Purchase {

  address public owner;
  Price p;
  Library lib;

  event Purchased(string _identity);

  constructor() public {
    owner = msg.sender;
  }

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function setDelegateAddresses(address priceAddr, address libAddr) public restricted {
    p = Price(priceAddr);
    lib = Library(libAddr);
  }

  function purchase(string identity, string contentId, string hContentId, uint16 cost) public {
    uint16 price = p.getPrice(hContentId);
    require (price == cost);
    // call ARA token contract transfer() function with cost
    lib.addLibraryItem(identity, contentId);
    emit Purchased(contentId);
  }

}

contract Price {
  function getPrice(string identity) public view returns (uint16 price);
}

contract Library {
  function addLibraryItem(string identity, string contentId) public;
}
