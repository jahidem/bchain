const hre = require("hardhat");
const fs = require("fs");
const csv = require("csv-parser");
const { PinataSDK } = require("pinata-web3");
const path = require("path");
require("dotenv").config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL
});

// Function to read the CSV file and parse the data into an array
async function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        let results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (err) => reject(err));
    });
}

// upload to ipfs
async function uploadToPinata(patientData) {
  try {
    const jsonData = JSON.stringify(patientData, null, 2);
    const filePath = path.join(__dirname, "data.txt");

    fs.writeFileSync(filePath, jsonData, "utf-8");

    const blob = new Blob([fs.readFileSync(filePath)], { type: "text/plain" });
    const file = new File([blob], "data.txt");

    const uploadResponse = await pinata.upload.file(file);

    fs.unlinkSync(filePath);

    console.log("File uploaded to Pinata. IPFS Hash:", uploadResponse.IpfsHash);
    return uploadResponse.IpfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    return null;
  }
}

// Function to measure execution time of an asynchronous function
async function measureExecutionTime(asyncFunc, label) {
    const start = process.hrtime();
    const result = await asyncFunc();
    const end = process.hrtime(start);
    const executionTimeMs = (end[0] * 1000 + end[1] / 1e6).toFixed(2);
    return { result, executionTimeMs };
}

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🚀 Deploying transactions with account:", deployer.address);

    // Load the contract
    const lightweightContract = await hre.ethers.getContractAt("LightweightMedicalContract", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

    // Read CSV files
    const patients = await readCSV("./data/patient.csv");
    const doctors = await readCSV("./data/doctor.csv");
    const dataSize = 3

    // Initialize storage for JSON output
    const performanceMetrics = {
        patient: {
          addPatient: [],
          deletePatient: []
        },
        doctor: {
          addDoctor: [],
          deleteDoctor: []
        },
    };

    // patients Ethereum contract
    console.log("\n📌 Patients to Ethereum contract...");
    for (let i = 0; i < Math.min(dataSize, patients.length); i++) {
        const patientData = patients[i];

        if (!patientData.patient_id || !patientData.age) {
            console.log(`Skipping invalid patient data for ID ${patientData.patient_id}`);
            continue;
        }
        const patient = {
                patient_id: parseInt(patientData.patient_id),
                age: parseInt(patientData.age),
                highBP: parseInt(patientData.highBP),
                highChol: parseInt(patientData.highChol),
                cholCheck: parseInt(patientData.cholCheck),
                bmi: parseInt(patientData.bmi),
                smoker: parseInt(patientData.smoker),
                stroke: parseInt(patientData.stroke)
        }
        const ipfs_hash = await uploadToPinata(patient);

        console.log(`Adding Patient ${patientData.patient_id}...`);

        const { result: txEth, executionTimeMs } = await measureExecutionTime(
            () => lightweightContract.addPatient(
                patient.patient_id,
                ipfs_hash,
                patient.age,
                patient.highBP,
                patient.highChol,
                patient.cholCheck,
                patient.bmi,
                patient.smoker,
                patient.stroke
            ),
            `Ethereum Patient ID ${patientData.patient_id}`
        );

        const receiptEth = await txEth.wait();
        performanceMetrics.patient.addPatient.push({
            id: patientData.patient_id,
            gasUsed: receiptEth.gasUsed.toString(),
            executionTimeMs,
        });



        // Deleting patient
        console.log(`Deleting Patient ${patientData.patient_id}...`);
        const { result: txEthDelete, executionTimeMs: executionTimeMsDelete } = await measureExecutionTime(
            () => lightweightContract.deletePatient(
                parseInt(patientData.patient_id),
            ),
            `Ethereum Patient ID ${patientData.patient_id}`
        );

        const receiptEthDelete = await txEthDelete.wait();
        performanceMetrics.patient.deletePatient.push({
            id: patientData.patient_id,
            gasUsed: receiptEthDelete.gasUsed.toString(),
            executionTimeMs: executionTimeMsDelete,
        });
    }

    // doctors Ethereum contract
    console.log("\n📌 Doctors to Ethereum contract...");
    for (let i = 0; i < Math.min(dataSize, doctors.length); i++) {
        let doctorData = doctors[i];

        if (!doctorData.doctor_id || !doctorData.doctor_name) {
            console.log(`Skipping invalid doctor data for ID ${doctorData.doctor_id}`);
            continue;
        }
        doctorData.doctor_id = parseInt(doctorData.doctor_id)
        const ipfs_hash = await uploadToPinata(doctorData);
        console.log(`Adding Doctor ${doctorData.doctor_id}...`);
        const { result: txEth, executionTimeMs } = await measureExecutionTime(
            () => lightweightContract.addDoctor(
                parseInt(doctorData.doctor_id),
                ipfs_hash,
                doctorData.doctor_name,
                doctorData.crdntls,
                doctorData.gender,
                doctorData.hospital_name,
                doctorData.country,
                doctorData.specialty
            ),
            `Ethereum Doctor ID ${doctorData.doctor_id}`
        );

        const receiptEth = await txEth.wait();
        performanceMetrics.doctor.addDoctor.push({
            id: doctorData.doctor_id,
            gasUsed: receiptEth.gasUsed.toString(),
            executionTimeMs,
        });

        //deleting
        console.log(`Deleting Doctor ${doctorData.doctor_id}...`);
        const { result: txEthDelete, executionTimeMs: executionTimeMsDelete } = await measureExecutionTime(
            () => lightweightContract.deleteDoctor(
                parseInt(doctorData.doctor_id)
            ),
            `Ethereum Doctor ID ${doctorData.doctor_id}`
        );

        const receiptEthDelete = await txEthDelete.wait();
        performanceMetrics.doctor.deleteDoctor.push({
            id: doctorData.doctor_id,
            gasUsed: receiptEthDelete.gasUsed.toString(),
            executionTimeMs: executionTimeMsDelete,
        });
    }

    // Save the metrics to a JSON file
    fs.writeFileSync(
        path.join(__dirname, "performanceLightweight.json"),
        JSON.stringify(performanceMetrics, null, 2),
        "utf-8"
    );

    console.log("\n✅ All Data Successfully Stored in Smart Contracts!");
    console.log("📁 Performance metrics saved to 'performanceMetrics.json'.");
}

// Run the script
main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
