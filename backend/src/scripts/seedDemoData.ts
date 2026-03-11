import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import DiagnosisLog from '../models/DiagnosisLog.js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to DB");

        // Use the existing users found in DB
        const doctorUser = await User.findOne({ email: 'bilal@gmail.com', role: 'Doctor' });
        const patientUser = await User.findOne({ email: 'aunmohammad542@gmail.com', role: 'Patient' });

        if (!doctorUser || !patientUser) {
            console.error("Doctor or Patient user not found in the database. Please ensure they exist.");
            process.exit(1);
        }

        console.log("Found users...");

        // Ensure Patient profile exists
        let patient = await Patient.findOne({ userId: patientUser._id });
        if (!patient) {
            patient = new Patient({
                userId: patientUser._id,
                name: "Aun Tester",
                email: "aunmohammad542@gmail.com",
                phone: "1234567890",
                age: 26,
                gender: "Male"
            });
            await patient.save();
            console.log("Created Patient profile!");
        }

        // Create an Appointment
        const appt = new Appointment({
            patientId: patient._id,
            doctorId: doctorUser._id,
            date: new Date(Date.now() - 86400000), // yesterday
            status: "completed"
        });
        await appt.save();
        console.log("Created Appointment!");

        // Create a Prescription
        const rx = new Prescription({
            patientId: patient._id,
            doctorId: doctorUser._id,
            medicines: [
                { name: "Paracetamol", dosage: "500mg", duration: "5 days", instructions: "After meals" }
            ],
            instructions: "Rest well.",
            riskLevel: "Low"
        });
        await rx.save();
        console.log("Created Prescription!");

        // Create a Diagnosis
        const diag = new DiagnosisLog({
            patientId: patient._id,
            doctorId: doctorUser._id,
            symptoms: ["Fever", "Cough"],
            aiResponse: { prediction: "Common Cold", severity: "Low" },
            riskLevel: "Low",
            age: 26,
            gender: "Male"
        });
        await diag.save();
        console.log("Created Diagnosis Log!");

        console.log("Done seeding dummy data for the timeline!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
