import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, type CurrentUserData } from '../../common/decorators/current-user.decorator';
import {
  AuthResponse,
  CheckUserResponse,
  RegisterUserInput,
  TelegramAuthInput,
  UserResponse,
} from '../ecommerce/dto/ecommerce.dto';
import { AuthService } from './auth.service';

@Resolver(() => UserResponse)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => UserResponse, { name: 'me', description: 'Get current authenticated user profile' })
  async getMe(@CurrentUser() user?: CurrentUserData): Promise<UserResponse> {
    // If user is authenticated, query user, otherwise fallback to the seeded demo founder
    const targetUserId = user?.id || 'c3d79e60-9ff1-4a7b-a367-27b596dbcf41';
    return this.authService.getMe(targetUserId);
  }

  @Query(() => String, {
    name: 'generateDevTelegramInitData',
    description: 'Generates a cryptographically valid Telegram initData string using the active Bot Token for local/staging verification',
  })
  async generateDevTelegramInitData(
    @Args('userId', { nullable: true }) userId?: string,
    @Args('username', { nullable: true }) username?: string,
    @Args('firstName', { nullable: true }) firstName?: string,
    @Args('lastName', { nullable: true }) lastName?: string,
  ): Promise<string> {
    return this.authService.generateDevTelegramInitData(userId, username, firstName, lastName);
  }

  @Query(() => CheckUserResponse, {
    name: 'checkUserExists',
    description: 'Check whether a user exists in the Studio PostgreSQL database by ID, Telegram ID, username, or email',
  })
  async checkUserExists(@Args('identifier') identifier: string): Promise<CheckUserResponse> {
    return this.authService.checkUserExists(identifier);
  }

  @Mutation(() => AuthResponse, {
    name: 'registerUser',
    description: 'Register a new user identity in the Studio database',
  })
  async registerUser(@Args('input') input: RegisterUserInput): Promise<AuthResponse> {
    return this.authService.registerUser(input);
  }

  @Mutation(() => AuthResponse, {
    name: 'authenticateWithTelegram',
    description: 'Cryptographic Telegram Mini App / WebApp authentication',
  })
  async authenticateWithTelegram(@Args('input') input: TelegramAuthInput): Promise<AuthResponse> {
    return this.authService.authenticateWithTelegram(input.initData);
  }

  @Mutation(() => AuthResponse, {
    name: 'loginAsDemoFounder',
    description: 'Instant demo authorization as Founder Alex Morgan with a real database session',
  })
  async loginAsDemoFounder(): Promise<AuthResponse> {
    return this.authService.loginAsDemoFounder();
  }
}

