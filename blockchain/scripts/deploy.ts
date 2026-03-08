import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const ReportIntegrity = await ethers.getContractFactory("ReportIntegrity");
  const contract = await ReportIntegrity.deploy();
  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});