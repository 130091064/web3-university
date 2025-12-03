// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract YDToken is ERC20 {
    // 平台学币：YD
    constructor(uint256 initialSupply) ERC20("YD Token", "YD") {
        // initialSupply 传的是“最小单位”，例如 1_000_000 * 10**18
        _mint(msg.sender, initialSupply);
    }
}
