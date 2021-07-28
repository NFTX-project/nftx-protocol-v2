# NFTX Mint Distro Explaination

NFTX Mint Distro is a method of NFT distribution which uses the NFTX protocol as a foundation to distribute NFTs in a cheaper, more versatile manner.

The NFT contract interacts directly with NFTX in order modify the results of its actions. 
To put it simply:
- The NFT itself tricks NFTX in order to think its being filled with NFTs. When these are actually not backed by actual NFTs.
- When someone redeems the vault token, the NFT token is minted on the spot.

This means that the purchase costs, and the minting costs can occur entirely separate for every mint, essentially scaling NFT drops in a form.

This can allow for interesting situations:
- The market could price unminted (unrevealed) NFTs differently from revealed NFTs.
- NFT launches can occur entirely within an NFTX vault.
- Can configure the vault not allow revealed NFTs for a limited time.

The sale itself will be done through the purchase of ERC20 tokens which are actually NFTX vTokens for the NFTs vault. This will mean purchasing costs are constant complexity (much much cheaper), solving one problem of NFT gas wars which literally bring the ethereum chain to a halt for serveral minutes.

The process is as follows:
1. The team initiates the process, which creates a vault on NFTX (with the NFT itself as the owner).
2. The team "prefills" the vault with the set amount they wish to insert.
3. After filling the vault, the team will received N amount of vault tokens for unminted NFTs.
4. The team can distribute the tokens in any fair manner they wish.
5. Once the sale has completed a certain portion, a portion (5%) of the raised funds are used to match a matching amount of the vault tokens supply.
6. This way, revealing is priced entirely by the market. No more gas wars, no more reckless gambling, if the market wishes to receive extra, they can purchase it themselves. People can choose whether to reveal or hold onto their unrevealed NFTs.
7. After a majority of the tokens are revealed, the NFT will enable minting into the NFTX vault. This will lead to the remaining unrevealed tokens to be target redeem, and the pool will immediately become a floor poor.

The special part in all of this is, the gas costs of minting and purchasing are spread out entirely. The market can decide to mint their NFTs when they want, and people can purchase unrevealed in order to speculate on their own, with a liquidity pool backing their decisions constantly.

