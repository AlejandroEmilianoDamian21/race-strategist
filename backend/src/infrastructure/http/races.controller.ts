import { Controller, Get, Inject, Param } from '@nestjs/common';
import { GetRaceOverview } from '../../application/use-cases/get-race-overview.use-case.js';
import { ListRaces } from '../../application/use-cases/list-races.use-case.js';
import {
  type RaceListResponse,
  toRaceListResponse,
} from './dto/race-list.response.js';
import {
  type RaceOverviewResponse,
  toRaceOverviewResponse,
} from './dto/race-overview.response.js';

@Controller('races')
export class RacesController {
  constructor(
    @Inject(ListRaces) private readonly listRaces: ListRaces,
    @Inject(GetRaceOverview)
    private readonly getRaceOverview: GetRaceOverview,
  ) {}

  @Get()
  async list(): Promise<RaceListResponse> {
    return toRaceListResponse(await this.listRaces.execute());
  }

  @Get(':id/overview')
  async overview(@Param('id') id: string): Promise<RaceOverviewResponse> {
    return toRaceOverviewResponse(await this.getRaceOverview.execute(id));
  }
}
