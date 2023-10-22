// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@sismo-core/sismo-connect-solidity/contracts/SismoConnectLib.sol";

contract ETHOnline is SismoConnect {

    event ResponseVerified(SismoConnectVerifiedResult result);

    constructor()
        SismoConnect(
            buildConfig({
                // replace with your appId from the Sismo factory https://factory.sismo.io/
                // should match the appId used to generate the response in your frontend
                appId: 0x317f33139a7ccf10803e8aad499f4889,
                // For development purposes insert when using proofs that contains impersonation
                // Never use this in production
                isImpersonationMode: false
            })
        )
    {}

    function verifySismoConnectResponse(bytes memory response) public {
        // build the auth and claim requests that should match the response
        AuthRequest[] memory auths = new AuthRequest[](1);
        auths[0] = buildAuth({authType: AuthType.GITHUB});

        ClaimRequest[] memory claims = new ClaimRequest[](1);
        claims[0] = buildClaim({groupId: 0xd1baa3618b2ae5108dd7733f3fb6cbe7});

        // // ENS DAO Voters
        // claims[0] = buildClaim({groupId: 0x85c7ee90829de70d0d51f52336ea4722});
        // // Gitcoin passport with at least a score of 15
        // claims[1] = buildClaim({
        //     groupId: 0x1cde61966decb8600dfd0749bd371f12,
        //     value: 15,
        //     claimType: ClaimType.GTE
        // });

        // verify the response regarding our original request
        SismoConnectVerifiedResult memory result = verify({
            responseBytes: response,
            auths: auths,
            claims: claims,
            signature: buildSignature({message: "I vote Yes to Privacy"})
        });

        emit ResponseVerified(result);
    }
    
}