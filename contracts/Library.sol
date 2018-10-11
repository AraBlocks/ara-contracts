pragma solidity ^0.4.24;

import "./Registry.sol";

contract Library {
  address public owner_;
  mapping (bytes32 => Lib) private libraries_; // hashed methodless owner did => library
  Registry registry_;

  struct Lib {
    bytes32[] content; // content DID (unhashed)
    mapping(bytes32 => bool) owned; // contentDID (unhashed) => owned
  }

  event AddedToLib(bytes32 _contentId);
  event RemovedFromLib(bytes32 _contentId);

  constructor(address _registry) public {
    owner_ = msg.sender;
    registry_ = Registry(_registry);
  }

  modifier restricted() {
    require (msg.sender == owner_, "Sender not authorized.");
     _;
  }

  modifier fromProxy(bytes32 _contentId) {
    require (msg.sender == registry_.getProxyAddress(_contentId), "Proxy not authorized.");
     _;
  }

  function getLibrary(bytes32 _identity) public view returns (bytes32[]) {
    return libraries_[_identity].content;
  }

  function getLibrarySize(bytes32 _identity) public view returns (uint256) {
    return libraries_[_identity].content.length;
  }

  function owns(bytes32 _identity, bytes32 _contentId) public view returns (bool) {
    return libraries_[_identity].owned[_contentId];
  }

  function addLibraryItem(bytes32 _identity, bytes32 _contentId) public fromProxy(_contentId) {
    require(!libraries_[_identity].owned[_contentId], "Cannot add content that the account already owns.");
    libraries_[_identity].content.push(_contentId);
    libraries_[_identity].owned[_contentId] = true;
    emit AddedToLib(_contentId);
  }

  function removeLibraryItem(bytes32 _identity, bytes32 _contentId) public fromProxy(_contentId) {
    require(libraries_[_identity].owned[_contentId], "Cannot remove content that account does not own.");
    uint256 index = 0;
    bool found = false;
    for (uint256 i = 0; i < libraries_[_identity].content.length; i++) {
      if (libraries_[_identity].content[i] == _contentId) {
        found = true;
        index = i;
      }
    }
    assert(found);
    libraries_[_identity].content[index] = libraries_[_identity].content[libraries_[_identity].content.length - 1];
    delete libraries_[_identity].content[libraries_[_identity].content.length - 1];
    libraries_[_identity].content.length--;
    libraries_[_identity].owned[_contentId] = false;
    emit RemovedFromLib(_contentId);
  }
}
