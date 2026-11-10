var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { CreateLeadSchema, LeadResponseSchema } from '@induktr/contracts';
export var GqlLeadStatus;
(function (GqlLeadStatus) {
    GqlLeadStatus["NEW"] = "NEW";
    GqlLeadStatus["CONTACTED"] = "CONTACTED";
    GqlLeadStatus["QUALIFIED"] = "QUALIFIED";
    GqlLeadStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GqlLeadStatus["COMPLETED"] = "COMPLETED";
    GqlLeadStatus["REJECTED"] = "REJECTED";
})(GqlLeadStatus || (GqlLeadStatus = {}));
registerEnumType(GqlLeadStatus, {
    name: 'LeadStatus',
});
let CreateLeadInput = class CreateLeadInput extends createZodDto(CreateLeadSchema) {
    name;
    contact;
    budget;
    description;
    serviceType;
    referrer;
    idempotencyKey;
};
__decorate([
    Field(),
    __metadata("design:type", String)
], CreateLeadInput.prototype, "name", void 0);
__decorate([
    Field(),
    __metadata("design:type", String)
], CreateLeadInput.prototype, "contact", void 0);
__decorate([
    Field(),
    __metadata("design:type", String)
], CreateLeadInput.prototype, "budget", void 0);
__decorate([
    Field(),
    __metadata("design:type", String)
], CreateLeadInput.prototype, "description", void 0);
__decorate([
    Field({ defaultValue: 'FULL_CYCLE_ENGINEERING', nullable: true }),
    __metadata("design:type", String)
], CreateLeadInput.prototype, "serviceType", void 0);
__decorate([
    Field({ nullable: true }),
    __metadata("design:type", String)
], CreateLeadInput.prototype, "referrer", void 0);
__decorate([
    Field({ nullable: true }),
    __metadata("design:type", String)
], CreateLeadInput.prototype, "idempotencyKey", void 0);
CreateLeadInput = __decorate([
    InputType()
], CreateLeadInput);
export { CreateLeadInput };
let LeadResponse = class LeadResponse extends createZodDto(LeadResponseSchema) {
    id;
    name;
    contact;
    budget;
    description;
    status;
    createdAt;
};
__decorate([
    Field(),
    __metadata("design:type", String)
], LeadResponse.prototype, "id", void 0);
__decorate([
    Field(),
    __metadata("design:type", String)
], LeadResponse.prototype, "name", void 0);
__decorate([
    Field(),
    __metadata("design:type", String)
], LeadResponse.prototype, "contact", void 0);
__decorate([
    Field(),
    __metadata("design:type", String)
], LeadResponse.prototype, "budget", void 0);
__decorate([
    Field(),
    __metadata("design:type", String)
], LeadResponse.prototype, "description", void 0);
__decorate([
    Field(() => GqlLeadStatus),
    __metadata("design:type", String)
], LeadResponse.prototype, "status", void 0);
__decorate([
    Field(),
    __metadata("design:type", String)
], LeadResponse.prototype, "createdAt", void 0);
LeadResponse = __decorate([
    ObjectType()
], LeadResponse);
export { LeadResponse };
