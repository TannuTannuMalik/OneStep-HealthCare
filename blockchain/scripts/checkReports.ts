import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ABI = [
    "function verify(uint256 reportId) public view returns (bytes32, uint256)"
  ];

  const contract = new ethers.Contract(contractAddress, ABI, ethers.provider);

  console.log("Checking reports on blockchain...\n");

  // Check reports 1 to 20
  for (let i = 1; i <= 20; i++) {
    const [hash, timestamp] = await contract.verify(i);
    
    // If hash is not empty (0x000...000), report exists
    if (hash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log(`✅ Report #${i}`);
      console.log(`   Hash: ${hash}`);
      console.log(`   Stored at: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
      console.log("");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});