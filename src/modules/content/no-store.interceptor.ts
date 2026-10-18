import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Prevents browsers / proxies from caching public content responses so that
 * admin edits (images, text, …) are always reflected on the public site.
 */
@Injectable()
export class NoStoreInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<{
      setHeader: (name: string, value: string) => void;
    }>();
    response.setHeader('Cache-Control', 'no-store, max-age=0');
    return next.handle();
  }
}
