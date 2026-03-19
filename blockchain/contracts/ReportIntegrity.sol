// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReportIntegrity {

    struct Proof {
        bytes32 pdfHash;
        uint256 timestamp;
    }

    mapping(uint256 => Proof) public proofs;

    function storeProof(uint256 reportId, bytes32 pdfHash) public {
        proofs[reportId] = Proof(pdfHash, block.timestamp);
    }

    function verify(uint256 reportId) public view returns(bytes32,uint256){
        Proof memory p = proofs[reportId];
        return (p.pdfHash, p.timestamp);
    }
    
// ── Prescription ──────────────────────────────────────────────
    struct Prescription {
        bytes32 prescriptionHash;
        uint256 timestamp;
        bool isValid;
    }

    mapping(uint256 => Prescription) public prescriptions;

    function storePrescription(uint256 reportId, bytes32 prescriptionHash) public {
        prescriptions[reportId] = Prescription(prescriptionHash, block.timestamp, true);
    }

    function verifyPrescription(uint256 reportId) public view returns (bytes32, uint256, bool) {
        Prescription memory p = prescriptions[reportId];
        return (p.prescriptionHash, p.timestamp, p.isValid);
    }

    function invalidatePrescription(uint256 reportId) public {
        prescriptions[reportId].isValid = false;
    }
}

