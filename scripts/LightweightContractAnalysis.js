const hre = require("hardhat");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

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
    const dataSize = 10000

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

        console.log(`Adding Patient ${patientData.patient_id}...`);
        const { result: txEth, executionTimeMs } = await measureExecutionTime(
            () => lightweightContract.addPatient(
                parseInt(patientData.patient_id),
                parseInt(patientData.age),
                parseInt(patientData.highBP),
                parseInt(patientData.highChol),
                parseInt(patientData.cholCheck),
                parseInt(patientData.bmi),
                parseInt(patientData.smoker),
                parseInt(patientData.stroke)
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
        const doctorData = doctors[i];

        if (!doctorData.doctor_id || !doctorData.doctor_name) {
            console.log(`Skipping invalid doctor data for ID ${doctorData.doctor_id}`);
            continue;
        }

        console.log(`Adding Doctor ${doctorData.doctor_id}...`);
        const { result: txEth, executionTimeMs } = await measureExecutionTime(
            () => lightweightContract.addDoctor(
                parseInt(doctorData.doctor_id),
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
