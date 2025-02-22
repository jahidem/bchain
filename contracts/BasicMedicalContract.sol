// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract BasicMedicalContract {
    address public immutable admin;
    
    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }
    
    
    struct Patient {
        uint256 id;
        uint256 age;
        uint256 highBP;
        uint256 highChol;
        uint256 cholCheck;
        uint256 BMI;
        uint256 smoker;
        uint256 stroke;
    }
    
    struct Doctor {
        uint256 id;
        string name;
        string credentials;
        string gender;
        string hospitalName;
        string country;
        string specialty;
    }
    
    mapping(uint256 => Patient) public patients;
    mapping(uint256 => Doctor) public doctors;
    mapping(address => uint256) public patientAddressToId;
    
    uint256 public patientCount;
    uint256 public doctorCount;

    function addDoctor(
        uint256 _id,
        string memory _name,
        string memory _credentials,
        string memory _gender,
        string memory _hospitalName,
        string memory _country,
        string memory _specialty
    ) public onlyAdmin {
        require(doctors[_id].id == 0, "Doctor already registered");
        doctorCount++;
        doctors[_id] = Doctor(_id, _name, _credentials, _gender, _hospitalName, _country, _specialty);
    }

    function addPatient(
        uint256 _id,
        uint256 _age,
        uint256 _highBP,
        uint256 _highChol,
        uint256 _cholCheck,
        uint256 _BMI,
        uint256 _smoker,
        uint256 _stroke
    ) public {
        require(patients[_id].id == 0, "Patient already exists");
        patientCount++;
        patients[_id] = Patient(
            _id,
            _age,
            _highBP,
            _highChol,
            _cholCheck,
            _BMI,
            _smoker,
            _stroke
        );
    }

    function getPatient(uint256 patientId) public view returns (Patient memory) {
        return patients[patientId];
    }


    function deletePatient(uint256 patientId) public {
        require(patients[patientId].id != 0, "Patient does not exist");
        delete patients[patientId];
    }

    function getDoctor(uint256 doctorId) public view returns (Doctor memory) {
        return doctors[doctorId];
    }

    function deleteDoctor(uint256 doctorId) public {
        require(doctors[doctorId].id != 0, "Doctor does not exist");
        delete doctors[doctorId];
    }
}