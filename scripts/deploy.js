const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🚀 Deploying contracts with account:", deployer.address);

    // Deploy Ethereum basic Contract
    const basic = await hre.ethers.getContractFactory("BasicMedicalContract");
    const basicContract = await basic.deploy();
    await basicContract.deployed();
    console.log("Basic Contract deployed to:", await basicContract.address);

    // Deploy Ethereum lightweight Contract
    const lightweight = await hre.ethers.getContractFactory("LightweightMedicalContract");
    const lightweightContract = await lightweight.deploy();
    await lightweightContract.deployed();
    console.log("Lightweight Contract deployed to:", await lightweightContract.address);
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
