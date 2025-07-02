import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { message: string } {
    return { message: 'ok' };
  }
}
