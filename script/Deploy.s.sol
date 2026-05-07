// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Pot} from "../contracts/Pot.sol";
import {PotBadges} from "../contracts/PotBadges.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Deploy script for Pot + PotBadges.
/// @dev Required env vars:
///        - PRIVATE_KEY      (deployer key, hex with 0x)
///        - CUSD_ADDRESS     (cUSD ERC20 on the target chain)
///        - TREASURY_ADDRESS (where protocol fees flow)
///        - BADGE_BASE_URI   (optional; can be set later via setBaseURI)
///
/// @dev Usage:
///        forge script script/Deploy.s.sol:Deploy \
///          --rpc-url alfajores \
///          --broadcast \
///          --verify
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address cUSDAddress = vm.envAddress("CUSD_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        string memory baseURI = vm.envOr("BADGE_BASE_URI", string(""));

        vm.startBroadcast(pk);

        Pot pot = new Pot(IERC20(cUSDAddress), treasury);
        PotBadges badges = new PotBadges();

        // wire them together
        badges.setPot(address(pot));
        pot.setBadges(address(badges));

        if (bytes(baseURI).length > 0) {
            badges.setBaseURI(baseURI);
        }

        vm.stopBroadcast();

        console2.log("Pot:", address(pot));
        console2.log("PotBadges:", address(badges));
        console2.log("cUSD:", cUSDAddress);
        console2.log("treasury:", treasury);
    }
}
