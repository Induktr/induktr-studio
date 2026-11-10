import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, type CurrentUserData } from '../../common/decorators/current-user.decorator';
import {
  CreateCustomOrderInput,
  CustomOrderResponse,
  InitPurchaseInput,
  ProductResponse,
  PurchaseResponse,
  SystemShowcaseResponse,
} from './dto/ecommerce.dto';
import { EcommerceService } from './ecommerce.service';

@Resolver()
export class EcommerceResolver {
  constructor(private readonly ecommerceService: EcommerceService) {}

  @Query(() => [ProductResponse], { name: 'products', description: 'List available studio digital products' })
  async getProducts(): Promise<ProductResponse[]> {
    return this.ecommerceService.getProducts();
  }

  @Query(() => [PurchaseResponse], { name: 'myPurchases', description: 'Retrieve user digital purchases' })
  async getMyPurchases(@CurrentUser() user?: CurrentUserData): Promise<PurchaseResponse[]> {
    const userId = user?.id || 'demo-client-uuid';
    return this.ecommerceService.getUserPurchases(userId);
  }

  @Query(() => [CustomOrderResponse], { name: 'myOrders', description: 'Retrieve user custom orders' })
  async getMyOrders(@CurrentUser() user?: CurrentUserData): Promise<CustomOrderResponse[]> {
    const userId = user?.id || 'demo-client-uuid';
    return this.ecommerceService.getUserOrders(userId);
  }

  @Query(() => String, { name: 'getDigitalDownloadUrl', description: 'Generate presigned download URL for paid purchase' })
  async getDigitalDownloadUrl(
    @Args('purchaseId') purchaseId: string,
    @CurrentUser() user?: CurrentUserData,
  ): Promise<string> {
    const userId = user?.id || 'demo-client-uuid';
    return this.ecommerceService.generateDigitalDownloadUrl(purchaseId, userId);
  }

  @Query(() => [SystemShowcaseResponse], { name: 'systemShowcases', description: 'List active studio system showcases and benchmarks' })
  async getSystemShowcases(): Promise<SystemShowcaseResponse[]> {
    return this.ecommerceService.getSystemShowcases();
  }

  @Mutation(() => CustomOrderResponse, { name: 'createCustomOrder', description: 'Create a custom studio engineering order' })
  async createCustomOrder(
    @Args('input') input: CreateCustomOrderInput,
    @CurrentUser() user?: CurrentUserData,
  ): Promise<CustomOrderResponse> {
    const userId = user?.id || 'demo-client-uuid';
    return this.ecommerceService.createCustomOrder(userId, input);
  }

  @Mutation(() => PurchaseResponse, { name: 'initPurchase', description: 'Initialize digital product purchase' })
  async initPurchase(
    @Args('input') input: InitPurchaseInput,
    @CurrentUser() user?: CurrentUserData,
  ): Promise<PurchaseResponse> {
    const userId = user?.id || 'demo-client-uuid';
    return this.ecommerceService.initPurchase(userId, input.productId);
  }
}
