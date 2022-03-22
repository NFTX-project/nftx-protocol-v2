// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../util/Ownable.sol";
import "../token/IERC20Upgradeable.sol";

contract ZapRegistry is Ownable {
    address[] private zaps;
    mapping(address => bool) private isZap;
    mapping(address => string) private zapNames;
    mapping(bytes32 => bool) private namesTaken;

    event ZapAdded(string name, address zapAddr);
    event ZapRemoved(address zapAddr, string name);
    event ZapNameUpdated(address zapAddr, string oldName, string newName);
    event ZapAddressUpdated(
        string name,
        address oldZapAddr,
        address newZapAddr
    );

    constructor() Ownable() {}

    function addZap(address zapAddr, string memory name) public onlyOwner {
        require(!isZap[zapAddr], "zapAddr already exists");
        require(!isNameTaken(name), "name already exists");
        zaps.push(zapAddr);
        isZap[zapAddr] = true;
        zapNames[zapAddr] = name;
        namesTaken[keccak256(abi.encodePacked(name))] = true;
        emit ZapAdded(name, zapAddr);
    }

    function findAndRemoveZap(address zapAddr) public onlyOwner {
        require(isZap[zapAddr], "zapAddr does not exist");
        uint256 index = indexOfZap(zapAddr);
        removeZapAt(index);
    }

    function removeZapAt(uint256 index) public onlyOwner {
        require(index < zaps.length, "index out of bounds");
        address zapAddr = zaps[index];

        uint256 length = zaps.length;
        for (uint256 i = index; i < length - 1; ++i) {
            zaps[i] = zaps[i + 1];
        }
        zaps.pop();

        isZap[zapAddr] = false;
        string memory zapName = zapNames[zapAddr];
        zapNames[zapAddr] = "";
        namesTaken[keccak256(abi.encodePacked(zapName))] = false;

        emit ZapRemoved(zapAddr, zapName);
    }

    function updateZapName(address zapAddr, string calldata newName)
        public
        onlyOwner
    {
        require(isZap[zapAddr], "zapAddr does not exist");
        require(!isNameTaken(newName), "name already exists");
        string memory oldName = zapNames[zapAddr];
        zapNames[zapAddr] = newName;

        namesTaken[keccak256(abi.encodePacked(oldName))] = false;
        namesTaken[keccak256(abi.encodePacked(newName))] = true;

        emit ZapNameUpdated(zapAddr, oldName, newName);
    }

    function updateZapAddress(address oldZapAddr, address newZapAddr)
        public
        onlyOwner
    {
        require(isZap[oldZapAddr], "oldZapAddr does not exist");
        require(!isZap[newZapAddr], "newZapAddr already exists");

        uint256 index = indexOfZap(oldZapAddr);

        zaps[index] = newZapAddr;
        isZap[newZapAddr] = true;
        isZap[oldZapAddr] = false;
        zapNames[newZapAddr] = zapNames[oldZapAddr];
        zapNames[oldZapAddr] = "";

        emit ZapAddressUpdated(zapNames[newZapAddr], oldZapAddr, newZapAddr);
    }

    function getZapName(address zapAddr) public view returns (string memory) {
        require(isZap[zapAddr], "not a zap");
        return zapNames[zapAddr];
    }

    function isAZap(address addr) public view returns (bool) {
        return isZap[addr];
    }

    function isTheZap(address addr, string calldata name)
        public
        view
        returns (bool)
    {
        return isZap[addr] && _areStringsEqual(zapNames[addr], name);
    }

    function getZapAddressAt(uint256 index) public view returns (address) {
        require(index < zaps.length, "index out of bounds");
        return zaps[index];
    }

    function getZapNameAt(uint256 index) public view returns (string memory) {
        require(index < zaps.length, "index out of bounds");
        return zapNames[zaps[index]];
    }

    function getAllZapAddresses() public view returns (address[] memory) {
        address[] memory zapAddresses = zaps;
        return zapAddresses;
    }

    function getAllZapNames() public view returns (string[] memory) {
        uint256 length = zaps.length;
        string[] memory _zapNames = new string[](length);
        for (uint256 i; i < length; ++i) {
            _zapNames[i] = zapNames[zaps[i]];
        }
        return _zapNames;
    }

    function isNameTaken(string memory name) public view returns (bool) {
        bytes32 nameBytes = keccak256(abi.encodePacked(name));
        return namesTaken[nameBytes];
    }

    function numberOfZaps() public view returns (uint256) {
        return zaps.length;
    }

    function indexOfZap(address zapAddr) public view returns (uint256) {
        uint256 length = zaps.length;
        uint256 index;
        for (index; index < length; ++index) {
            if (zaps[index] == zapAddr) {
                break;
            }
        }
        require(zaps[index] == zapAddr, "zapAddr not found");
        return index;
    }

    function _areStringsEqual(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    receive() external payable {
        revert("Don't send ETH");
    }

    function rescue(address token) external onlyOwner {
        IERC20Upgradeable(token).transfer(
            msg.sender,
            IERC20Upgradeable(token).balanceOf(address(this))
        );
    }
}
