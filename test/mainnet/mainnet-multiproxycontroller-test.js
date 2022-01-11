const { expect } = require("chai");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");
const { expectException } = require("../../utils/expectRevert");

const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob;
let dev;
let dao;
let nftx;
let lpStaking;
let inventoryStaking;
let erc721;
let feeDistrib;
let provider;
let multiProxyController;

describe("MultiProxyController Mainnet Test", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 13727800,
          },
        },
      ],
    });

    signers = await ethers.getSigners();
    primary = signers[0];
    alice = signers[1];
    bob = signers[2];

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a"],
    });
    
    kiwi = await ethers.provider.getSigner(
      "0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"
    );
    dao = await ethers.provider.getSigner(
      "0x40d73df4f99bae688ce3c23a01022224fe16c7b2"
    );
    founder = await ethers.provider.getSigner(
      "0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B"
    );
    dev = await ethers.provider.getSigner(
      "0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a"
    );

    nftx = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );
    lpStaking = await ethers.getContractAt(
      "NFTXLPStaking",
      "0x688c3E4658B5367da06fd629E41879beaB538E37"
    );
    controller = await ethers.getContractAt(
      "ProxyController",
      "0x4333d66Ec59762D1626Ec102d7700E64610437Df"
    );
    feeDistrib = await ethers.getContractAt(
      "NFTXSimpleFeeDistributor",
      "0xFD8a76dC204e461dB5da4f38687AdC9CC5ae4a86"
    );
  });

  it("Should upgrade the Fee Distributor", async () => {
    let NewFeeDistro = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
    let feeDistro = await NewFeeDistro.connect(alice).deploy();
    await feeDistro.deployed();
    let proxyAdmin = await ethers.getContractAt("ProxyControllerSimple", "0x8e7488E4cEC0381e7Ac758234E1A8A793bE2fF30");
    await proxyAdmin.connect(dev).upgradeProxyTo(feeDistro.address, {gasLimit: 100000});
  });

  it("Should deploy inventory staking", async () => {
    const InventoryStaking = await ethers.getContractFactory("NFTXInventoryStaking");
    inventoryStaking = await upgrades.deployProxy(
      InventoryStaking,
      [nftx.address],
      {
        initializer: "__NFTXInventoryStaking_init",
        unsafeAllow: 'delegatecall'
      }
    );
    await inventoryStaking.deployed();
    await feeDistrib.connect(dev).setInventoryStakingAddress(inventoryStaking.address, {gasLimit: 100000})
    await feeDistrib.connect(dev).addReceiver(BASE.div(5), inventoryStaking.address, true, {gasLimit: 100000})
  })

  it("Should deploy multiproxycontroller", async () => {
    const MultiProxyController = await ethers.getContractFactory(
      "MultiProxyController"
    );
    multiProxyController = await MultiProxyController.deploy(
      [
        "Vault Factory",
        "Fee Distributor",
        "LP Staking",
      ],
      [
        nftx.address,
        feeDistrib.address,
        lpStaking.address,
      ]
    );
    await multiProxyController.deployed();
  });

  it("Should assign initial proxies properly", async () => {
    let proxiesInfo = await multiProxyController.getAllProxiesInfo();
    let expectedInfo = [
      "0: Vault Factory",
      "1: Fee Distributor",
      "2: LP Staking",
    ]
    for (let i = 0; i < proxiesInfo.length; i++) {
      expect(proxiesInfo[i]).to.be.equal(expectedInfo[i]);
    }
  }) 

  it("Should get all proxy addresses", async () => {
    let proxies = await multiProxyController.getAllProxies();
    let expectedInfo = [
      nftx.address,
      feeDistrib.address,
      lpStaking.address,
    ]
    for (let i = 0; i < proxies.length; i++) {
      expect(proxies[i]).to.be.equal(expectedInfo[i]);
    }
  })

  it("Assign all to multiproxycontroller", async () => {
    await controller.connect(dao).changeAllProxyAdmins(multiProxyController.address);
    let proxyAdmin = await ethers.getContractAt("ProxyControllerSimple", "0x8e7488E4cEC0381e7Ac758234E1A8A793bE2fF30");
    await proxyAdmin.connect(dev).changeProxyAdmin(multiProxyController.address, {gasLimit: 100000});
    await upgrades.admin.changeProxyAdmin(inventoryStaking.address, multiProxyController.address);
  });
  
  
  it("Can read all impls", async () => {
    let impls = await multiProxyController.getAllImpls();
    for (let i = 0; i < 3; i++) {
      expect(impls[i]).to.not.equal(zeroAddr);
    }
  })

  it("Should allow adding proxies", async () => {
    let oldImpls = await multiProxyController.getAllImpls();
    await multiProxyController.addProxy("Inventory Staking", inventoryStaking.address);
    let newImpls = await multiProxyController.getAllImpls();
    expect(newImpls.length).to.equal(oldImpls.length + 1);
    let oldCopy = [...oldImpls]
    oldCopy.push(inventoryStaking.address);
    for (let i = 0; i < newImpls;i++) {
      expect(newImpls[i]).to.equal(oldImpls[i]);
    }
  });

  it("Can read all impls", async () => {
    let impls = await multiProxyController.getAllImpls();
    for (let i = 0; i < 4; i++) {
      expect(impls[i]).to.not.equal(zeroAddr);
    }
  })

  it("Should upgrade the NFTX Factory", async () => {
    let NewFactory = await ethers.getContractFactory("NFTXVaultFactoryUpgradeable");
    let newFactory = await NewFactory.deploy();
    await newFactory.deployed();
    await multiProxyController.upgradeProxyTo(0, newFactory.address, {gasLimit: 100000});
  });

  it("Should upgrade the Fee Distributor", async () => {
    let NewFeeDistro = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
    let feeDistro = await NewFeeDistro.deploy();
    await feeDistro.deployed();
    await multiProxyController.upgradeProxyTo(1, feeDistro.address, {gasLimit: 100000});
  });

  it("Should upgrade the LP Staking", async () => {
    let NewStaking = await ethers.getContractFactory("NFTXLPStaking");
    let newStaking = await NewStaking.deploy();
    await newStaking.deployed();
    await multiProxyController.upgradeProxyTo(2, newStaking.address, {gasLimit: 100000});
  });

  it("Should upgrade the Inventory Staking", async () => {
    let NewStaking = await ethers.getContractFactory("NFTXInventoryStaking");
    let newStaking = await NewStaking.deploy();
    await newStaking.deployed();
    await multiProxyController.upgradeProxyTo(3, newStaking.address, {gasLimit: 100000});
  });

  let oldImpls;
  it("Should pass over ownership of index 1", async () => {
    oldImpls = await multiProxyController.getAllImpls();
    let addr = await multiProxyController.getImpl(1);
    let proxyAdmin = await ethers.getContractAt("ProxyControllerSimple", "0x8e7488E4cEC0381e7Ac758234E1A8A793bE2fF30");
    await multiProxyController.changeProxyAdmin(1, proxyAdmin.address);
    await proxyAdmin.fetchImplAddress()
    expect(await proxyAdmin.impl()).to.equal(addr);
    await expectException(multiProxyController.getImpl(1), "function selector was not recognized");
  })

  it("Should allow removing proxies safely", async () => {
    await multiProxyController.removeProxy(1);
    let newImpls = await multiProxyController.getAllImpls();

    expect(newImpls.length).to.equal(oldImpls.length - 1);
    var oldCopy = [...oldImpls];
    oldCopy.splice(1, 1);
    for (let i = 0; i < newImpls.length; i++) {
      expect(newImpls[i]).to.equal(oldCopy[i]);
    }
  })

  let multiProxyController2;
  it("Should deploy multiproxycontroller", async () => {
    const MultiProxyController = await ethers.getContractFactory(
      "MultiProxyController"
    );
    multiProxyController2 = await MultiProxyController.deploy(
      [
        "Vault Factory",
        "LP Staking",
        "Inventory Staking",
      ],
      [
        nftx.address,
        lpStaking.address,
        inventoryStaking.address,
      ]
    );
    await multiProxyController2.deployed();
  });

  it("Should pass over ownership of all", async () => {
    await multiProxyController["changeAllAdmins(address)"](multiProxyController2.address);
  })

  it("Can read all impls", async () => {
    let impls = await multiProxyController2.getAllImpls();
    for (let i = 0; i < 4; i++) {
      expect(impls[i]).to.not.equal(zeroAddr);
    }
  })

  it("Should pass over ownership of last 2", async () => {
    await multiProxyController2["changeAllAdmins(uint256,uint256,address)"](1,2,multiProxyController.address);
    await multiProxyController.removeProxy(0)
  })

  it("Can read all impls", async () => {
    let impls = await multiProxyController.getAllImpls();
    for (let i = 0; i < 4; i++) {
      expect(impls[i]).to.not.equal(zeroAddr);
    }
  })
});
