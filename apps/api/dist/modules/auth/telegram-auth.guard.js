var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramAuthGuard_1;
import { Injectable, Logger, UnauthorizedException, } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GqlExecutionContext } from "@nestjs/graphql";
import { createHmac, timingSafeEqual } from "crypto";
import { pickWhiteList } from "@induktr/contracts";
let TelegramAuthGuard = TelegramAuthGuard_1 = class TelegramAuthGuard {
    config;
    logger = new Logger(TelegramAuthGuard_1.name);
    botToken;
    cachedSecretKey = null;
    constructor(config) {
        this.config = config;
        this.botToken = this.config.get("TELEGRAM_BOT_TOKEN");
    }
    getSecretKey() {
        if (!this.cachedSecretKey && this.botToken) {
            if (typeof Bun !== "undefined" && Bun.CryptoHasher) {
                this.cachedSecretKey = new Bun.CryptoHasher("sha256", "WebAppData")
                    .update(this.botToken)
                    .digest();
            }
            else {
                this.cachedSecretKey = createHmac("sha256", "WebAppData")
                    .update(this.botToken)
                    .digest();
            }
        }
        return this.cachedSecretKey;
    }
    canActivate(context) {
        const gqlCtx = GqlExecutionContext.create(context);
        const req = gqlCtx.getContext()?.req || context.switchToHttp().getRequest();
        const authHeader = req.headers.authorization || req.headers["x-telegram-init-data"];
        if (!authHeader) {
            throw new UnauthorizedException("Missing Telegram initData header");
        }
        const initDataStr = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : String(authHeader);
        const isValid = this.verifyTelegramInitData(initDataStr);
        if (!isValid) {
            throw new UnauthorizedException("Invalid Telegram cryptographic signature");
        }
        // Attach parsed user to request using strict whitelist
        const params = new URLSearchParams(initDataStr);
        const userStr = params.get("user");
        if (userStr) {
            try {
                const rawUser = JSON.parse(userStr);
                req.user = pickWhiteList(rawUser, [
                    "id",
                    "first_name",
                    "last_name",
                    "username",
                    "language_code",
                    "is_premium",
                ]);
            }
            catch {
                // Fallback
            }
        }
        return true;
    }
    /**
     * Cryptographic verification using HMAC-SHA256 with "WebAppData" secret key
     */
    verifyTelegramInitData(initData) {
        if (!this.botToken) {
            this.logger.error("TELEGRAM_BOT_TOKEN is not configured.");
            throw new UnauthorizedException("TELEGRAM_BOT_TOKEN not configured");
        }
        try {
            const params = new URLSearchParams(initData);
            const hash = params.get("hash");
            if (!hash)
                return false;
            // Verify auth_date against server time to prevent replay attacks (within 86400s)
            const authDateStr = params.get("auth_date");
            if (!authDateStr)
                return false;
            const authDate = parseInt(authDateStr, 10);
            if (Number.isNaN(authDate))
                return false;
            const now = Math.floor(Date.now() / 1000);
            if (now - authDate > 86400 || authDate > now + 60) {
                return false;
            }
            params.delete("hash");
            // Sort alphabetically
            const dataCheckString = Array.from(params.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}=${v}`)
                .join("\n");
            const secretKey = this.getSecretKey();
            if (!secretKey)
                return false;
            let computedHash;
            if (typeof Bun !== "undefined" && Bun.CryptoHasher) {
                computedHash = new Bun.CryptoHasher("sha256", secretKey)
                    .update(dataCheckString)
                    .digest();
            }
            else {
                computedHash = createHmac("sha256", secretKey)
                    .update(dataCheckString)
                    .digest();
            }
            const hashBuf = Buffer.from(hash, "hex");
            if (hashBuf.length !== computedHash.length) {
                return false;
            }
            return timingSafeEqual(computedHash, hashBuf);
        }
        catch (e) {
            if (e instanceof UnauthorizedException)
                throw e;
            this.logger.error("Cryptographic signature verification failed", e);
            return false;
        }
    }
};
TelegramAuthGuard = TelegramAuthGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], TelegramAuthGuard);
export { TelegramAuthGuard };
