const { expect } = require("chai");
const { ethers } = require("hardhat");

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE = 1e18;
const TOKENS_IN_0X = 500;


// Store our internal contract references
let weth, erc721;
let nftx, vault, vault1155, staking;
let marketplaceZap, mock0xProvider;

// Store any user addresses we want to interact with
let deployer, alice, bob, users;


/**
 * Validates our expected NFTX allocator logic.
 */

describe('0x Marketplace Zap', function () {

  /**
   * Confirm that tokens cannot be sent to invalid recipient.
   */

  before(async function () {
    // Set up our deployer / owner address
    [deployer, alice, bob, carol, ...users] = await ethers.getSigners()

    // Set up a test ERC20 token to simulate WETH
    const WETH = await ethers.getContractFactory("WETH");
    weth = await WETH.deploy();
    await weth.deployed();

    // Fill our WETH contract with Carol's juicy ETH
    await carol.sendTransaction({
      to: weth.address,
      value: ethers.utils.parseEther("50")
    })

    // Set up a test ERC721 token
    const Erc721 = await ethers.getContractFactory("ERC721");
    erc721 = await Erc721.deploy('SpacePoggers', 'POGGERS');
    await erc721.deployed();

    // Set up a test ERC1155 token
    const Erc1155 = await ethers.getContractFactory("ERC1155");
    erc1155 = await Erc1155.deploy('https://space.poggers/');
    await erc1155.deployed();

    // Set up our NFTX contracts
    await _initialise_nftx_contracts()

    // Set up our 0x mock. Our mock gives us the ability to set a range of parameters
    // against the contract that would normally be out of our control. This allows us
    // to control expected, external proceedures.
    const Mock0xProvider = await ethers.getContractFactory("Mock0xProvider")
    mock0xProvider = await Mock0xProvider.deploy()
    await mock0xProvider.deployed()

    // Set up our NFTX Marketplace 0x Zap
    const MarketplaceZap = await ethers.getContractFactory('NFTXMarketplace0xZap')
    marketplaceZap = await MarketplaceZap.deploy(nftx.address, weth.address)
    await marketplaceZap.deployed()

    // Mint the vault asset address to Alice (10 tokens)
    for (let i = 0; i < 10; ++i) {
      await erc721.publicMint(alice.address, i);
    }

    // Mint the vault asset address to Bob (5 unapproved tokens)
    for (let i = 10; i < 15; ++i) {
      await erc721.publicMint(bob.address, i);
    }

    // Mint some tokens to Carol that we will use later to generate vault token
    // liquidity in our mocked 0x provider
    for (let i = 15; i < 25; ++i) {
      await erc721.publicMint(carol.address, i);
    }

    expect(await erc721.balanceOf(alice.address)).to.equal(10);
    expect(await erc721.balanceOf(bob.address)).to.equal(5);
    expect(await erc721.balanceOf(carol.address)).to.equal(10);

    // Approve the Marketplace Zap to use Alice's ERC721s
    await erc721.connect(alice).setApprovalForAll(marketplaceZap.address, true);

    // Mint 10x the vault asset address to Alice (10 tokens)
    for (let i = 0; i < 10; ++i) {
      await erc1155.publicMint(alice.address, i, 10);
    }

    // Mint 10x the vault asset address to Bob (5 unapproved tokens)
    for (let i = 10; i < 15; ++i) {
      await erc1155.publicMint(bob.address, i, 10);
    }

    for (let i = 0; i < 10; ++i) {
      expect(await erc1155.balanceOf(alice.address, i)).to.equal(10);
    }

    for (let i = 10; i < 15; ++i) {
      expect(await erc1155.balanceOf(bob.address, i)).to.equal(10);
    }

    // Approve the Marketplace Zap to use Alice's ERC721s
    await erc1155.connect(alice).setApprovalForAll(marketplaceZap.address, true);

    // Add payout token liquidity to the 0x pool
    await weth.mint(mock0xProvider.address, String(BASE * TOKENS_IN_0X))
    expect(await weth.balanceOf(mock0xProvider.address)).to.equal(String(BASE * TOKENS_IN_0X))
  });


  /**
   * Mints tokens from our NFTX vault and sells them on 0x.
   */

  describe('mintAndSell721', async function () {

    before(async function () {
      // Set the 0x payout token and amount
      await mock0xProvider.setPayInAmount(String(BASE * 0.9));  // 1 - 10% fees
      await mock0xProvider.setPayOutAmount(String(BASE * 1));   // 1
    });


    /**
     * Confirm that tokens cannot be sent to invalid recipient.
     */

    it("Should not allow recipient to be NULL address or contract", async function () {
      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [1, 2, 3],                // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault.address,
            weth.address
          ),
          NULL_ADDRESS              // to
        )
      ).to.be.revertedWith('Invalid recipient');

      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [1, 2, 3],                // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault.address,
            weth.address
          ),
          marketplaceZap.address    // to
        )
      ).to.be.revertedWith('Invalid recipient');
    });


    /**
     * Confirm that >= 1 ID must be requested.
     */

    it("Should require >= 1 token ID", async function () {
      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [],                       // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault.address,
            weth.address
          ),
          alice.address             // to
        )
      ).to.be.revertedWith('Must send IDs');
    });


    /**
     * Confirm that invalid tokens result in tx rejection.
     */

    it("Should not allow unowned or unapproved ERC721s to be sent", async function () {
      // Unowned token
      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [11],                     // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault.address,
            weth.address
          ),
          alice.address             // to
        )
      ).to.be.reverted;

      // Unapproved token
      await expect(
        marketplaceZap.connect(bob).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [11],                     // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault.address,
            weth.address
          ),
          bob.address               // to
        )
      ).to.be.reverted;
    });


    /**
     * Confirm that our vault balance is calculated correctly based on the number of IDs provided
     * and the mint fee set on the NFTX vault.
     */

    it("Should correctly return the vault and vault balance", async function () {
      // Currently Alice should be the only owner of the ERC721 tokens
      expect(await erc721.balanceOf(alice.address)).to.equal(10)
      expect(await erc721.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await erc721.balanceOf(vault.address)).to.equal(0)

      // Successfully mint and sell 1 token against our zap into the vault
      await marketplaceZap.connect(alice).mintAndSell721(
        await vault.vaultId(),    // vaultId
        [1],                      // ids
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          vault.address,
          weth.address
        ),
        alice.address             // to
      )

      // Alice should have 1 less token than she did before as it has been sold
      // into the vault.
      expect(await erc721.balanceOf(alice.address)).to.equal(9)
      expect(await erc721.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await erc721.balanceOf(vault.address)).to.equal(1)
    });


    /**
     * Confirm that a tx can be actioned with another wallet being the recipient.
     */

    it("Should allow sender to purchase on behalf of another wallet", async function () {
      expect(await erc721.balanceOf(alice.address)).to.equal(9)
      expect(await erc721.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await erc721.balanceOf(vault.address)).to.equal(1)

      await marketplaceZap.connect(alice).mintAndSell721(
        await vault.vaultId(),    // vaultId
        [2],                      // ids
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          vault.address,
          weth.address
        ),
        bob.address               // to
      )

      // Alice should have 1 less token than she did before as it has been sold
      // into the vault. This is in addition to the 1 already sent from a previous
      // test.
      expect(await erc721.balanceOf(alice.address)).to.equal(8)
      expect(await erc721.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await erc721.balanceOf(vault.address)).to.equal(2)
    });

  })


  /**
   * Purchases vault tokens from 0x with WETH and then swaps the tokens for
   * either random or specific token IDs from the vault. The specified recipient will
   * receive the ERC721 tokens, as well as any WETH dust that is left over from the tx.
   */

  describe('buyAndSwap721', async function () {

    /**
     *
     */

    before(async function () {
      // Set our payIn amount to be 1 WETH
      await mock0xProvider.setPayInAmount(String(BASE * 0.1));

      // Set our payOut token amount to 0.1. This will provide enough vault tokens
      // to mint an ERC721 after calculating the mint fee also.
      await mock0xProvider.setPayOutAmount(String(BASE * 0.1));
    });


    /**
     * Confirm that tokens cannot be sent to invalid recipient.
     */

    it("Should not allow recipient to be NULL address or contract", async function () {
      await expect(
        marketplaceZap.connect(alice).buyAndSwap721(
          await vault.vaultId(),    // vaultId
          [4, 5, 6],                // idsIn
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          NULL_ADDRESS              // to
        )
      ).to.be.revertedWith('Invalid recipient');

      await expect(
        marketplaceZap.connect(alice).buyAndSwap721(
          await vault.vaultId(),    // vaultId
          [4, 5, 6],                // idsIn
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          marketplaceZap.address    // to
        )
      ).to.be.revertedWith('Invalid recipient');
    });


    /**
     * Confirm that >= 1 ID must be requested.
     */

    it("Should require >= 1 token ID", async function () {
      await expect(
        marketplaceZap.connect(alice).buyAndSwap721(
          await vault.vaultId(),    // vaultId
          [],                       // idsIn
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          alice.address             // to
        )
      ).to.be.revertedWith('Must send IDs');
    });

    it('Should prevent insufficient balance from buying', async function () {
      await expect(
        marketplaceZap.connect(alice).buyAndSwap721(
          await vault.vaultId(),    // vaultId
          [4, 5, 6],                // idsIn
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          alice.address             // to
        )
      ).to.be.reverted
    });

    it('Should be able to fill quote', async function () {
      // From previous tests we already have IDs 1 and 2 in the vault
      expect(await erc721.balanceOf(vault.address)).to.equal(2)

      // Process a buy of 1 WETH -> 0.1 tokens + token -> 1 different ERC721
      await marketplaceZap.connect(alice).buyAndSwap721(
        await vault.vaultId(),    // vaultId
        [4],                      // idsIn
        [],                       // specificIds
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          weth.address,            // payInToken
          vault.address            // payOutToken
        ),
        alice.address,            // to
        {
          value: ethers.utils.parseEther('1')  // redeemFees
        }
      )

      // Alice should now have 1 ERC721 of either ID 1 or 2, instead of 4
      expect(await erc721.balanceOf(alice.address)).to.equal(8)
      expect(await erc721.balanceOf(vault.address)).to.equal(2)
      expect(await erc721.ownerOf(4)).to.equal(vault.address)
    });

    it('Should be able to fill quote for specific IDs', async function () {
      // From previous tests we already have 2 IDs in the vault and bob
      // should still have all of his original 5.
      expect(await erc721.balanceOf(vault.address)).to.equal(2)
      expect(await erc721.balanceOf(bob.address)).to.equal(5)

      // Process a buy of 1 WETH -> 0.1 tokens + token -> 1 different ERC721
      await marketplaceZap.connect(alice).buyAndSwap721(
        await vault.vaultId(),    // vaultId
        [5],                      // idsIn
        [4],                      // specificIds
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          weth.address,            // payInToken
          vault.address            // payOutToken
        ),
        alice.address,            // to
        {
          value: ethers.utils.parseEther('1')  // redeemFees
        }
      )

      // Bob should now have one of the ERC721 tokens that were in the vault, token 5
      // should be in the vault, and Alice will have one less than when she started.
      expect(await erc721.balanceOf(alice.address)).to.equal(8)
      expect(await erc721.balanceOf(vault.address)).to.equal(2)
      expect(await erc721.ownerOf(4)).to.equal(alice.address)
      expect(await erc721.ownerOf(5)).to.equal(vault.address)
    });

    it('Should be able to fill quote to another recipient', async function () {
      // From previous tests we already have 2 IDs in the vault and bob
      // should still have all of his original 5.
      expect(await erc721.balanceOf(vault.address)).to.equal(2)
      expect(await erc721.balanceOf(bob.address)).to.equal(5)

      // Process a buy of 1 WETH -> 0.1 tokens + token -> 1 different ERC721
      await marketplaceZap.connect(alice).buyAndSwap721(
        await vault.vaultId(),    // vaultId
        [6],                      // idsIn
        [],                       // specificIds
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          weth.address,            // payInToken
          vault.address            // payOutToken
        ),
        bob.address,            // to
        {
          value: ethers.utils.parseEther('1')  // redeemFees
        }
      )

      // Bob should now have one of the ERC721 tokens that were in the vault, token 6
      // should be in the vault, and Alice will have one less than when she started.
      expect(await erc721.balanceOf(alice.address)).to.equal(7)
      expect(await erc721.balanceOf(bob.address)).to.equal(6)
      expect(await erc721.balanceOf(vault.address)).to.equal(2)
      expect(await erc721.ownerOf(6)).to.equal(vault.address)
    });

    it('Should be able to fill quote with muiltiple IDs', async function () {
      // From previous tests we already have 2 IDs in the vault
      expect(await erc721.balanceOf(vault.address)).to.equal(2)

      // Process a buy of 1 WETH -> 0.1 tokens + token -> 1 different ERC721
      await marketplaceZap.connect(alice).buyAndSwap721(
        await vault.vaultId(),    // vaultId
        [7, 8],                   // idsIn
        [],                       // specificIds
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          weth.address,            // payInToken
          vault.address            // payOutToken
        ),
        alice.address,            // to
        {
          value: ethers.utils.parseEther('2')  // redeemFees
        }
      )

      // The vault should now have ERC 7 and 8 inside and Alice should still retain
      // 7 tokens (as Bob has 1 from a previous test).
      expect(await erc721.balanceOf(alice.address)).to.equal(7)
      expect(await erc721.balanceOf(vault.address)).to.equal(2)
      expect(await erc721.ownerOf(7)).to.equal(vault.address)
      expect(await erc721.ownerOf(8)).to.equal(vault.address)
    });

  })

  describe('buyAndRedeem', async function () {

    /**
     *
     */

    before(async function () {
      // Set our payIn amount to be 1 WETH
      await mock0xProvider.setPayInAmount(String(BASE * 1));

      // Set our payOut token amount to 1. This will provide enough vault tokens
      // to mint an ERC721 after calculating the mint fee also.
      await mock0xProvider.setPayOutAmount(String(BASE * 1));

      // Send Bob's ERC721 tokens to the vault to ensure that we have enough tokens
      // to be redeemed during tests.
      await erc721.connect(bob).setApprovalForAll(marketplaceZap.address, true);
      await erc721.connect(bob).transferFrom(bob.address, vault.address, 10);
      await erc721.connect(bob).transferFrom(bob.address, vault.address, 11);
      await erc721.connect(bob).transferFrom(bob.address, vault.address, 12);
      await erc721.connect(bob).transferFrom(bob.address, vault.address, 13);
      await erc721.connect(bob).transferFrom(bob.address, vault.address, 14);

      // Transfer Carol's hard earned vault tokens to our mock 0x provider to
      // provide some liquidity. We transfer a reduced number of tokens due to
      // 0.1 fees per token being taken during the vault process.
      await erc721.connect(carol).setApprovalForAll(vault.address, true);
      await vault.connect(carol).mint([15, 16, 17, 18, 19], []);
      await vault.connect(carol).transfer(mock0xProvider.address, '4000000000000000000');
    });


    /**
     * Confirm that tokens cannot be sent to invalid recipient.
     */

    it("Should not allow recipient to be NULL address or contract", async function () {
      await expect(
        marketplaceZap.connect(alice).buyAndRedeem(
          await vault.vaultId(),    // vaultId
          3,                        // amount
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          NULL_ADDRESS              // to
        )
      ).to.be.revertedWith('Invalid recipient');

      await expect(
        marketplaceZap.connect(alice).buyAndRedeem(
          await vault.vaultId(),    // vaultId
          1,                        // amount
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          marketplaceZap.address    // to
        )
      ).to.be.revertedWith('Invalid recipient');
    });


    /**
     * Confirm that >= 1 ID must be requested.
     */

    it("Should require >= 1 amount", async function () {
      await expect(
        marketplaceZap.connect(alice).buyAndRedeem(
          await vault.vaultId(),    // vaultId
          0,                        // amount
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          alice.address             // to
        )
      ).to.be.revertedWith('Must send amount');
    });

    it('Should prevent insufficient balance from buying', async function () {
      await expect(
        marketplaceZap.connect(alice).buyAndRedeem(
          await vault.vaultId(),    // vaultId
          1,                        // amount
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          alice.address             // to
        )
      ).to.be.reverted

      await expect(
        marketplaceZap.connect(alice).buyAndRedeem(
          await vault.vaultId(),    // vaultId
          2,                        // amount
          [],                       // specificIds
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            weth.address,
            vault.address
          ),
          alice.address,             // to
          {
            value: ethers.utils.parseEther('0.01')  // redeemFees
          }
        )
      ).to.be.reverted
    });


    /**
     *
     */

    it('Should be able to fill quote', async function () {
      expect(await erc721.balanceOf(alice.address)).to.equal(7)
      expect(await erc721.balanceOf(vault.address)).to.equal(12)

      // Process a buy of 1 ERC721 -> 1.1 tokens -> 1 ERC721
      await marketplaceZap.connect(alice).buyAndRedeem(
        await vault.vaultId(),    // vaultId
        1,                        // amount
        [],                       // specificIds
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          weth.address,            // payInToken
          vault.address            // payOutToken
        ),
        alice.address,            // to
        {
          value: ethers.utils.parseEther('1')  // redeemFees
        }
      )

      // Alice should have purchased 1 ERC721 from the vault, meaning that the vault
      // has been reduced to 1 token. As this was a random buy, we don't know exactly
      // which token was purchased.
      expect(await erc721.balanceOf(alice.address)).to.equal(8)
      expect(await erc721.balanceOf(vault.address)).to.equal(11)
    });

  })


  /**
   * Mints tokens from our NFTX vault and sells them on 0x.
   */

  describe('mintAndSell1155', async function () {

    before(async function () {
      // Set the 0x payout token and amount
      await mock0xProvider.setPayInAmount(String(BASE * 0.9));  // 1 - 10% fees
      await mock0xProvider.setPayOutAmount(String(BASE * 1));   // 1
    });


    /**
     * Confirm that tokens cannot be sent to invalid recipient.
     */

    it("Should not allow recipient to be NULL address or contract", async function () {
      await expect(
        marketplaceZap.connect(alice).mintAndSell1155(
          await vault1155.vaultId(),// vaultId
          [1, 2, 3],                // ids
          [1, 1, 1],                // amounts
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault1155.address,
            weth.address
          ),
          NULL_ADDRESS              // to
        )
      ).to.be.revertedWith('Invalid recipient');

      await expect(
        marketplaceZap.connect(alice).mintAndSell1155(
          await vault1155.vaultId(),// vaultId
          [1, 2, 3],                // ids
          [1, 1, 1],                // amounts
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault1155.address,
            weth.address
          ),
          marketplaceZap.address    // to
        )
      ).to.be.revertedWith('Invalid recipient');
    });


    /**
     * Confirm that >= 1 ID must be requested.
     */

    it("Should require >= 1 token ID", async function () {
      await expect(
        marketplaceZap.connect(alice).mintAndSell1155(
          await vault1155.vaultId(),// vaultId
          [],                       // ids
          [],                       // amounts
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault1155.address,
            weth.address
          ),
          alice.address             // to
        )
      ).to.be.revertedWith('Must send IDs');
    });


    /**
     * Confirm that >= 1 ID must be requested.
     */

    it("Should require >= 1 amount to be specified for token", async function () {
      await expect(
        marketplaceZap.connect(alice).mintAndSell1155(
          await vault1155.vaultId(),// vaultId
          [1],                      // ids
          [0],                      // amounts
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault1155.address,
            weth.address
          ),
          alice.address             // to
        )
      ).to.be.revertedWith('Invalid 1155 amount');
    });



    /**
     * Confirm that invalid tokens result in tx rejection.
     */

    it("Should not allow unowned or unapproved ERC1155s to be sent", async function () {
      // Unowned token
      await expect(
        marketplaceZap.connect(alice).mintAndSell1155(
          await vault1155.vaultId(),// vaultId
          [11],                     // ids
          [1],                      // amounts
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault1155.address,
            weth.address
          ),
          alice.address             // to
        )
      ).to.be.reverted;

      // Unapproved token
      await expect(
        marketplaceZap.connect(bob).mintAndSell1155(
          await vault1155.vaultId(),// vaultId
          [11],                     // ids
          [1],                      // amounts
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            vault1155.address,
            weth.address
          ),
          bob.address               // to
        )
      ).to.be.reverted;
    });


    /**
     * Confirm that our vault balance is calculated correctly based on the number of IDs provided
     * and the mint fee set on the NFTX vault.
     */

    it("Should correctly return the vault and vault balance", async function () {
      // Currently Alice should be the only owner of the ERC1155 tokens
      expect(await erc1155.balanceOf(alice.address, 1)).to.equal(10)
      expect(await erc1155.balanceOf(marketplaceZap.address, 1)).to.equal(0)
      expect(await erc1155.balanceOf(vault1155.address, 1)).to.equal(0)

      // Successfully mint and sell 1 token against our zap into the vault
      await marketplaceZap.connect(alice).mintAndSell1155(
        await vault1155.vaultId(),// vaultId
        [1],                      // ids
        [1],                      // amounts
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          vault1155.address,
          weth.address
        ),
        alice.address             // to
      )

      // Alice should have 1 less token than she did before as it has been sold
      // into the vault.
      expect(await erc1155.balanceOf(alice.address, 1)).to.equal(9)
      expect(await erc1155.balanceOf(marketplaceZap.address, 1)).to.equal(0)
      expect(await erc1155.balanceOf(vault1155.address, 1)).to.equal(1)
    });


    /**
     * Confirm that our vault balance is calculated correctly based on the number of IDs provided
     * and the mint fee set on the NFTX vault.
     */

    it("Should be able to batch transfer tokens", async function () {
      // Currently Alice should be the only owner of the ERC1155 tokens
      expect(await erc1155.balanceOf(alice.address, 1)).to.equal(9)
      expect(await erc1155.balanceOf(alice.address, 2)).to.equal(10)
      expect(await erc1155.balanceOf(marketplaceZap.address, 1)).to.equal(0)
      expect(await erc1155.balanceOf(marketplaceZap.address, 2)).to.equal(0)
      expect(await erc1155.balanceOf(vault1155.address, 1)).to.equal(1)
      expect(await erc1155.balanceOf(vault1155.address, 2)).to.equal(0)

      // Successfully mint and sell 1 token against our zap into the vault
      await marketplaceZap.connect(alice).mintAndSell1155(
        await vault1155.vaultId(),// vaultId
        [1, 2],                   // ids
        [3, 2],                   // amounts
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          vault1155.address,
          weth.address
        ),
        alice.address             // to
      )

      expect(await erc1155.balanceOf(alice.address, 1)).to.equal(6)
      expect(await erc1155.balanceOf(alice.address, 2)).to.equal(8)
      expect(await erc1155.balanceOf(marketplaceZap.address, 1)).to.equal(0)
      expect(await erc1155.balanceOf(marketplaceZap.address, 2)).to.equal(0)
      expect(await erc1155.balanceOf(vault1155.address, 1)).to.equal(4)
      expect(await erc1155.balanceOf(vault1155.address, 2)).to.equal(2)
    });

    /**
     * Confirm that a tx can be actioned with another wallet being the recipient.
     */

    it("Should allow sender to purchase on behalf of another wallet", async function () {
      expect(await erc1155.balanceOf(alice.address, 2)).to.equal(8)
      expect(await erc1155.balanceOf(bob.address, 2)).to.equal(0)
      expect(await erc1155.balanceOf(marketplaceZap.address, 2)).to.equal(0)
      expect(await erc1155.balanceOf(vault1155.address, 2)).to.equal(2)

      await marketplaceZap.connect(alice).mintAndSell1155(
        await vault1155.vaultId(),// vaultId
        [2],                      // ids
        [3],                      // amounts
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          vault1155.address,
          weth.address
        ),
        bob.address               // to
      )

      expect(await erc1155.balanceOf(alice.address, 2)).to.equal(5)
      expect(await erc1155.balanceOf(bob.address, 2)).to.equal(0)
      expect(await erc1155.balanceOf(marketplaceZap.address, 2)).to.equal(0)
      expect(await erc1155.balanceOf(vault1155.address, 2)).to.equal(5)
    });

  })

});


async function _initialise_nftx_contracts() {
  const StakingProvider = await ethers.getContractFactory("MockStakingProvider");
  const provider = await StakingProvider.deploy();
  await provider.deployed();

  const Staking = await ethers.getContractFactory("NFTXLPStaking");
  staking = await upgrades.deployProxy(Staking, [provider.address], {
    initializer: "__NFTXLPStaking__init",
    unsafeAllow: 'delegatecall'
  });
  await staking.deployed();

  const NFTXVault = await ethers.getContractFactory("NFTXVaultUpgradeable");
  const nftxVault = await NFTXVault.deploy();
  await nftxVault.deployed();

  const FeeDistributor = await ethers.getContractFactory(
    "NFTXSimpleFeeDistributor"
  );
  const feeDistrib = await upgrades.deployProxy(
    FeeDistributor,
    [staking.address, weth.address],
    {
      initializer: "__SimpleFeeDistributor__init__",
      unsafeAllow: 'delegatecall'
    }
  );
  await feeDistrib.deployed();

  const Nftx = await ethers.getContractFactory("NFTXVaultFactoryUpgradeable");
  nftx = await upgrades.deployProxy(
    Nftx,
    [nftxVault.address, feeDistrib.address],
    {
      initializer: "__NFTXVaultFactory_init",
      unsafeAllow: 'delegatecall'
    }
  );
  await nftx.deployed();

  // Connect our contracts to the NFTX Vault Factory
  await feeDistrib.connect(deployer).setNFTXVaultFactory(nftx.address);
  await staking.connect(deployer).setNFTXVaultFactory(nftx.address);

  // Register our 721 NFTX vault that we will use for testing
  let response = await nftx.createVault(
    'Space Poggers',  // name
    'POGGERS',        // symbol
    erc721.address,   // _assetAddress
    false,            // is1155
    true              // allowAllItems
  );

  let receipt = await response.wait(0);
  let vaultId = receipt.events.find((elem) => elem.event === "NewVault").args[0].toString();
  let vaultAddr = await nftx.vault(vaultId)
  let vaultArtifact = await artifacts.readArtifact("NFTXVaultUpgradeable");

  vault = new ethers.Contract(
    vaultAddr,
    vaultArtifact.abi,
    ethers.provider
  );

  // Register our 1155 NFTX vault that we will use for testing
  response = await nftx.createVault(
    'Pace Spoggers',  // name
    'SPOGGERS',       // symbol
    erc1155.address,  // _assetAddress
    true,             // is1155
    true              // allowAllItems
  );

  receipt = await response.wait(0);
  vaultId = receipt.events.find((elem) => elem.event === "NewVault").args[0].toString();
  vaultAddr = await nftx.vault(vaultId)
  vaultArtifact = await artifacts.readArtifact("NFTXVaultUpgradeable");

  vault1155 = new ethers.Contract(
    vaultAddr,
    vaultArtifact.abi,
    ethers.provider
  );
}

function _create_call_data(tokenIn, tokenOut) {
  let parsedABI = new ethers.utils.Interface(["function transfer(address spender, address tokenIn, address tokenOut) payable"]);
  return parsedABI.encodeFunctionData('transfer', [marketplaceZap.address, tokenIn, tokenOut])
}
