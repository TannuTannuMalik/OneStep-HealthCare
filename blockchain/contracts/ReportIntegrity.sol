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
           bool isDispensed;      
    uint256 dispensedAt; 
    }

    mapping(uint256 => Prescription) public prescriptions;

  function storePrescription(uint256 reportId, bytes32 prescriptionHash) public {
    prescriptions[reportId] = Prescription(
        prescriptionHash,
        block.timestamp,
        true,
        false,     // not dispensed yet
        0
    );
}
function dispense(uint256 reportId) public {
    require(prescriptions[reportId].isValid, "Invalid prescription");
    require(!prescriptions[reportId].isDispensed, "Already dispensed");

    prescriptions[reportId].isDispensed = true;
    prescriptions[reportId].dispensedAt = block.timestamp;
}

    function verifyPrescription(uint256 reportId)
    public
    view
    returns (bytes32, uint256, bool, bool, uint256)
{
    Prescription memory p = prescriptions[reportId];
    return (
        p.prescriptionHash,
        p.timestamp,
        p.isValid,
        p.isDispensed,
        p.dispensedAt
    );
}

    function invalidatePrescription(uint256 reportId) public {
        prescriptions[reportId].isValid = false;
    }
}

