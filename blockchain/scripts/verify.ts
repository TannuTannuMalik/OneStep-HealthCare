import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  // Put your deployed contract address here
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const ReportIntegrity = await ethers.getContractAt("ReportIntegrity", contractAddress);

  // Store a proof
  const reportId = 1;
  const pdfHash = ethers.keccak256(ethers.toUtf8Bytes("test-pdf-content"));
  
  console.log("Storing proof...");
  const tx = await ReportIntegrity.storeProof(reportId, pdfHash);
  await tx.wait();
  console.log("Proof stored!");

  // Verify it
  console.log("Verifying proof...");
  const [storedHash, timestamp] = await ReportIntegrity.verify(reportId);
  console.log("PDF Hash:", storedHash);
  console.log("Timestamp:", new Date(Number(timestamp) * 1000).toLocaleString());
  console.log("Hash matches:", storedHash === pdfHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});