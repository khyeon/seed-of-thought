import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: { username: string; password: string }) {
        const user = await this.authService.validateUser(body.username, body.password);
        if (!user) {
            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        return this.authService.login(user);
    }

    @Post('mock-login')
    async mockLogin(@Body() body: { email: string; name: string }) {
        const user = await this.authService.validateOAuthUser({
            email: body.email,
            name: body.name,
        });
        return this.authService.login(user);
    }
}
