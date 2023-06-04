import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from 'typeorm';
import { UserModel } from '../user/user-model';

@Entity('patient')
export class PatientModel {
	@PrimaryGeneratedColumn('uuid', { name: 'patient_id' })
	id: string;

	@ManyToOne(() => UserModel, { onDelete: 'CASCADE', nullable: false })
	@JoinColumn({ name: 'user_id' })
	@RelationId((patient: PatientModel) => patient.userId)
	userId: string;

	@Column({ name: 'phone_number', type: 'varchar', unique: true })
	phoneNumber: string;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	constructor(userId?: string, phoneNumber?: string) {
		this.userId = userId;
		this.phoneNumber = phoneNumber;
	}
}