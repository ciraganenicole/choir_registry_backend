import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ChoirContext {
    choirId: string;
    role: string;
}

export const ChoirContext = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): ChoirContext => {
        const request = ctx.switchToHttp().getRequest();
        return request.choirContext;
    },
); 