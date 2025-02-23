// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract LightweightMedicalContract {
    address public immutable admin;

    constructor() {
        admin = msg.sender;
    }



    struct Patient {
        uint256 id;
        bytes32 dataHash;
        string ipfs_hash;
    }

    struct Doctor {
        uint256 id;
        bytes32 dataHash;
        string ipfs_hash;
    }

    mapping(uint256 => Patient) public patients;
    mapping(uint256 => Doctor) public doctors;

    uint256 public patientCount;
    uint256 public doctorCount;

    function addDoctor(
        uint256 _id,
        string memory _ipfs_hash,
        string memory _name,
        string memory _credentials,
        string memory _gender,
        string memory _hospitalName,
        string memory _country,
        string memory _specialty
    ) public {
        require(!doctorExists(_id), "Doctor already registered");
        doctorCount++;
        bytes32 dataHash = keccak256(
            abi.encodePacked(_id,_ipfs_hash, _name, _credentials, _gender, _hospitalName, _country, _specialty)
        );

        doctors[_id] = Doctor(_id, dataHash, _ipfs_hash);
    }

    function addPatient(
        uint256 _id,
        string memory _ipfs_hash,
        uint256 _age,
        uint256 _highBP,
        uint256 _highChol,
        uint256 _cholCheck,
        uint256 _BMI,
        uint256 _smoker,
        uint256 _stroke) public {
        require(!patientExists(_id), "Patient already exists");
        patientCount++;
        bytes32 dataHash = keccak256(
          abi.encodePacked(
              _id,
              _ipfs_hash,
              _age,
              _highBP,
              _highChol,
              _cholCheck,
              _BMI,
              _smoker,
              _stroke
          )
        );

        patients[_id] = Patient(_id, dataHash, _ipfs_hash);
    }

    function getPatientHash(uint256 patientId) public view returns (bytes32) {
        require(patientExists(patientId), "Patient does not exist");
        return patients[patientId].dataHash;
    }


    function verifyPatientData(uint256 patientId, bytes32 computedHash) public view returns (bool) {
        require(patientExists(patientId), "Patient does not exist");
        return patients[patientId].dataHash == computedHash;
    }

    function getDoctorHash(uint256 doctorId) public view returns (bytes32) {
        require(doctorExists(doctorId), "Doctor does not exist");
        return doctors[doctorId].dataHash;
    }

    function deletePatient(uint256 patientId) public {
        require(patientExists(patientId), "Patient does not exist");
        delete patients[patientId];
        patientCount--;
    }

    function deleteDoctor(uint256 doctorId) public {
        require(doctorExists(doctorId), "Doctor does not exist");
        delete doctors[doctorId];
        doctorCount--;
    }

    function patientExists(uint256 patientId) internal view returns (bool) {
        return patients[patientId].id != 0;
    }

    function doctorExists(uint256 doctorId) internal view returns (bool) {
        return doctors[doctorId].id != 0;
    }
}
