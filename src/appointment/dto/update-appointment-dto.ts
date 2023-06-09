import { IsDateString, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { IsNotInThePast } from '../../common/decorator/is-not-in-the-past';

export class UpdateAppointmentDto {
	@IsOptional()
	public readonly patientId?: string;

	@IsOptional()
	public readonly doctorId?: string;

	@IsOptional()
	@IsDateString()
	@IsNotInThePast()
	public readonly date?: string;

	@IsNumber()
	@IsPositive()
	public readonly version: number;
}
