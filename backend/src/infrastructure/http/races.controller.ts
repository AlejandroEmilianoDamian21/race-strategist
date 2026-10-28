import { Controller, Get, Inject } from '@nestjs/common';
import { ListRaces } from '../../application/use-cases/list-races.use-case.js';
import {
  type RaceListResponse,
  toRaceListResponse,
} from './dto/race-list.response.js';

@Controller('races')
export class RacesController {
  constructor(@Inject(ListRaces) private readonly listRaces: ListRaces) {}

  @Get()
  async list(): Promise<RaceListResponse> {
    return toRaceListResponse(await this.listRaces.execute());
  }
}
