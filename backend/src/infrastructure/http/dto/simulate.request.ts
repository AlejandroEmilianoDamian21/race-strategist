import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { Strategy } from '../../../domain/model/strategy.js';

export class StintDto {
  @IsString()
  compound!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  laps!: number;
}

export class SimulateRequestDto {
  @IsString()
  @IsNotEmpty()
  raceId!: string;

  @IsString()
  @IsNotEmpty()
  driverId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StintDto)
  stints!: StintDto[];
}

export function toStrategy(dto: SimulateRequestDto): Strategy {
  return {
    raceId: dto.raceId,
    driverId: dto.driverId,
    stints: dto.stints.map((stint) => ({
      compound: stint.compound,
      laps: stint.laps,
    })),
  };
}
