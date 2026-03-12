import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
const ABI = [
  "function storeProof(uint256 reportId, bytes32 pdfHash) public",
  "function verify(uint256 reportId) public view returns (bytes32, uint256)"
];

export async function storeProofOnChain(reportId, pdfHashHex) {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  const bytes32Hash = "0x" + pdfHashHex.padStart(64, "0");
  const tx = await contract.storeProof(reportId, bytes32Hash);
  await tx.wait();
  return tx.hash;
}