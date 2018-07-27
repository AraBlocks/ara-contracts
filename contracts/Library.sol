pragma solidity ^0.4.24;

contract Library {
  address public owner;
  mapping (string => Lib) private libraries;
  Registry registry_;

  struct Lib {
    uint16 size;
    mapping (uint16 => string) content;
  }

  event LogAdded(string contentId);

  constructor(address _registry) public {
    owner = msg.sender;
    registry_ = Registry(_registry);
  }

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  modifier fromStandard(address _standard) {
    if (msg.sender == registry_.standard_) _;
  }

  function getLibrarySize(string identity) public view returns (uint16 size) {
    return libraries[identity].size;
  }

  function getLibraryItem(string identity, uint16 index) public view returns (string contentId) {
    require (index < libraries[identity].size && index >= 0);
    return libraries[identity].content[index];
  }

  function addLibraryItem(string identity, string contentId) public fromStandard {
    uint16 libSize = libraries[identity].size;
    require (bytes(libraries[identity].content[libSize]).length == 0);
    libraries[identity].content[libSize] = contentId;
    libraries[identity].size++;
    emit LogAdded(contentId);
  }
}

contract Registry {
  address public standard_;
}
