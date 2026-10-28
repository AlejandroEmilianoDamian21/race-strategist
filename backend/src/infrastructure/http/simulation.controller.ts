import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { SimulateStrategy } from '../../application/use-cases/simulate-strategy.use-case.js';
import { SimulateRequestDto, toStrategy } from './dto/simulate.request.js';
import {
  type SimulationResponse,
  toSimulationResponse,
} from './dto/simulation.response.js';

@Controller('simulate')
export class SimulationController {
  constructor(
    @Inject(SimulateStrategy)
    private readonly simulateStrategy: SimulateStrategy,
  ) {}

  @Post()
  @HttpCode(200)
  async simulate(
    @Body() body: SimulateRequestDto,
  ): Promise<SimulationResponse> {
    return toSimulationResponse(
      await this.simulateStrategy.execute(toStrategy(body)),
    );
  }
}
