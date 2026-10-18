import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

/** Maps a NOT NULL constraint violation (a null sent for a required column) to a 400. */
@Catch(QueryFailedError)
export class NotNullFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    if (exception.message.includes('NOT NULL constraint failed')) {
      super.catch(new BadRequestException('A required field was null'), host);
      return;
    }
    // Anything else behaves as if there were no filter: a generic 500.
    super.catch(exception, host);
  }
}
