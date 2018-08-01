pragma solidity ^0.4.24;

import "./Registry.sol";

contract Library {
  address public owner_;
  mapping (string => Lib) private libraries_;
  Registry registry_;

  struct Lib {
    uint16 size;
    mapping (uint16 => string) content;
  }

  event LogAdded(string contentId);

  constructor(address _registry) public {
    owner_ = msg.sender;
    registry_ = Registry(_registry);
  }

  modifier restricted() {
    require (msg.sender == owner_);
     _;
  }

  modifier fromStandard(string _contentId) {
    require (msg.sender == registry_.proxyImpls_(registry_.getProxyAddress(_contentId)));
     _;
  }

  function getLibrarySize(string _identity) public view returns (uint16 size) {
    return libraries_[_identity].size;
  }

  function getLibraryItem(string _identity, uint16 _index) public view returns (string contentId) {
    require (_index < libraries_[_identity].size);
    return libraries_[_identity].content[_index];
  }

  function addLibraryItem(string _identity, string _contentId) public fromStandard(_contentId) {
    uint16 libSize = libraries_[_identity].size;
    require (bytes(libraries_[_identity].content[libSize]).length == 0);
    libraries_[_identity].content[libSize] = _contentId;
    libraries_[_identity].size++;
    emit LogAdded(_contentId);
  }
}
