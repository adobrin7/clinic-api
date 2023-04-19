import * as http from 'http';
import * as path from 'path';
import { PatientsController } from '../controllers/patients-controller.mjs';
import { DoctorsController } from '../controllers/doctors-controller.mjs';
import { AppointmentsController } from '../controllers/appointments-controller.mjs';
import { PatientsRepository } from '../repositories/patients-repository.mjs';
import { DoctorsRepository } from '../repositories/doctors-repository.mjs';
import { AppointmentsRepository } from '../repositories/appointments-repository.mjs';
import { AppointmentsService } from '../services/appointments-service.mjs';

export class Server {
    constructor() {
        const patientsRepository = new PatientsRepository();
        const doctorsRepository = new DoctorsRepository();
        const apointmentsRepository = new AppointmentsRepository(path.resolve('assets', 'appointments.json'));

        const appointmentsService = new AppointmentsService(apointmentsRepository, patientsRepository, doctorsRepository)

        this.patientsController = new PatientsController(patientsRepository);
        this.doctorsController = new DoctorsController(doctorsRepository);
        this.appointmentsController = new AppointmentsController(appointmentsService);
    }

    getServer() {
        return http.createServer(async (req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);

            if (url.pathname === '/patients') {

                await this.handlePatients(req, res);

            } else if (url.pathname === '/doctors') {

                await this.handleDoctors(req, res);

            } else if (url.pathname === '/appointments') {

                await this.handleAppointments(req, res);

            }

            res.statusCode = 404;
            res.end();
        });
    }

    async handlePatients(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (req.method === 'GET') {
            if (url.searchParams.get('id')) {
                this.patientsController.getOne(req, res);
                return;
            }
            this.patientsController.getAll(req, res);
            return;
        }
    }

    async handleDoctors(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (req.method === 'GET') {
            if (url.searchParams.get('id')) {
                this.doctorsController.getOne(req, res);
                return;
            }
            this.doctorsController.getAll(req, res);
            return;
        }
    }

    async handleAppointments(req, res) {
        if (req.method === 'GET') {
            this.appointmentsController.getAll(req, res);
            return;
        }

        if (req.method === 'POST') {
            this.appointmentsController.schedule(req, res);
        }
    }
}