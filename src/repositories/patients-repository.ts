import * as path from 'path';
import * as fs from 'fs';
import { PatientEntity } from '../entities/patient-entity';

export class PatientsRepository {
    dataPath;
    patients;

    constructor() {
        this.dataPath = path.resolve('assets', 'patients.json');
        this.pullData();
    }

    pullData() {
        const data = fs.readFileSync(this.dataPath, { encoding: 'utf8' });
        this.patients = JSON.parse(data.toString())
            .map(p => new PatientEntity(p.firstName, p.phone));
    }

    getAll() {
        this.pullData();
        return this.patients;
    }

    getOne(phone) {
        this.pullData();
        return this.patients.find(p => p.phone === phone);
    }

    addOne(patient) {
        this.patients.push(patient);
        this.saveData();
    }

    saveData() {
        fs.writeFileSync(this.dataPath, JSON.stringify(this.patients, null, 2));
    }

    update(oldPhone, patient) {
        this.pullData();
        const patientIdx = this.patients.findIndex(p => p.phone === oldPhone);
        this.patients[patientIdx] = patient;
        this.saveData();
        return patient;
    }

    delete(phone) {
        this.pullData();

        const patientIdx = this.patients.findIndex((patient) => patient.phone === phone);

        if (patientIdx === -1) {
            return null;
        }

        const deletedPatient = this.patients.splice(patientIdx, 1)[0];
        this.saveData();

        return deletedPatient;
    }
}