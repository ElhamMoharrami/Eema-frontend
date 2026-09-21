// Structural response checks only. Spring owns authorization, state transitions and money.
export type Shape = (value: unknown) => boolean;
export const text: Shape = value => typeof value === "string";
export const number: Shape = value => typeof value === "number" && Number.isFinite(value);
export const boolean: Shape = value => typeof value === "boolean";
export const nullable = (shape: Shape): Shape => value => value === null || shape(value);
export const array = (shape: Shape): Shape => value => Array.isArray(value) && value.every(shape);
export const record: Shape = value => !!value && typeof value === "object" && !Array.isArray(value);
export const object = (fields: Record<string, Shape>): Shape => value => record(value)
  && Object.entries(fields).every(([key, shape]) => shape((value as Record<string, unknown>)[key]));
export const oneOf = (...values: string[]): Shape => value => typeof value === "string" && values.includes(value);
export const page = (item: Shape) => object({content: array(item), number, totalPages: number, totalElements: number, empty: boolean});

const bookingStatus = oneOf("REQUESTED", "AWAITING_PAYMENT", "CONFIRMED", "DECLINED", "EXPIRED", "UNAVAILABLE", "CANCELLED", "REFUNDED");
const venueStatus = oneOf("DRAFT", "PENDING", "ACTIVE", "SUSPENDED");
const refundStatus = oneOf("NONE", "CREATING", "QUEUED", "PENDING", "PROCESSING", "REFUNDED", "FAILED", "CANCELED");
const payoutStatus = oneOf("CALCULATED", "HELD", "READY", "PAID", "CANCELLED");
const contact = object({name:text,email:text,phone:nullable(text)});
const money = nullable(number);
export const booking = object({id:text,venueId:text,scoutId:text,status:bookingStatus,shootDate:text,startTime:text,endTime:text,
  venuePriceEur:number,totalPaidEur:number,refundStatus,scoutContact:contact,ownerContact:contact,
  hourlyRateEurSnapshot:number,minimumBookingMinutesSnapshot:number,fullDayRateEurSnapshot:money,durationMinutes:number,billableMinutes:number});
export const bookingSummary = object({id:text,venueId:text,scoutId:text,status:bookingStatus,shootDate:text,startTime:text,endTime:text,venuePriceEur:number,totalPaidEur:number,ownerPayoutEur:money,refundStatus});
export const payout = object({id:text,bookingId:text,venueId:text,currency:text,status:payoutStatus,grossRetainedAmountEur:number,commissionEur:number,providerCostEur:money,payoutAmountEur:number});
export const liability = object({id:text,bookingId:text,ownerId:text,type:oneOf("PROVIDER_COST","OWNER_PAYOUT_RECOVERY"),status:oneOf("OPEN","SETTLED","WAIVED"),amountEur:number});
export const bookingDetail = object({booking:bookingSummary,liabilities:array(liability),payout:nullable(payout),commissionPercentage:number,commissionEur:number,refundStatus});
export const bookingEvent = object({id:text,eventType:text,actorType:text,createdAt:text,payload:record});
export const exception = object({type:text,severity:oneOf("INFO","WARNING","CRITICAL"),reason:text,detectedAt:text});
export const incident = object({id:text,bookingId:text,reportedByUserId:text,category:text,description:text,status:oneOf("OPEN","UNDER_REVIEW","RESOLVED","CLOSED"),createdAt:text});
export const verification = object({ownerId:text,status:oneOf("UNVERIFIED","PENDING","VERIFIED","REJECTED")});
export const destination = object({id:text,ownerId:text,status:oneOf("PENDING_VERIFICATION","VERIFIED","REJECTED","REPLACED"),accountHolderName:text,maskedIban:text,currency:text});
export const reveal = object({id:text,accountHolderName:text,iban:text});
export const policy = object({id:text,policyType:oneOf("TERMS_OF_SERVICE","PRIVACY_POLICY","ACCEPTABLE_USE_POLICY","PRODUCTION_POLICY","INSURANCE_REQUIREMENTS"),version:text,title:text,content:text,status:oneOf("DRAFT","PUBLISHED","RETIRED"),accepted:boolean});
export const policyStatus = object({allRequiredAccepted:boolean,missing:array(policy)});
export const inquiry = object({id:text,venueId:text,venueName:text,scoutId:text,timezone:text,requestedDate:text,requestedStartTime:text,requestedEndTime:text,message:text,status:oneOf("OPEN","DECLINED","OFFERED","EXPIRED","ACCEPTED")});
const venueFields = {id:text,name:text,neighbourhood:text,sizeM2:number,hourlyRateEur:number,minimumBookingMinutes:number,minimumLeadTimeMinutes:number,fullDayRateEur:money,tags:array(text),status:venueStatus};
export const venueList = object(venueFields);
export const venue = object({...venueFields,photoPaths:array(text),timezone:text});
export const moderation = object({status:venueStatus,readinessIssues:array(text)});
export const trustEvent = object({id:text,eventType:text,actorType:text,createdAt:text});
export const availabilitySettings = object({venueId:text,timezone:text,weekly:array(object({id:text,dayOfWeek:text,startTime:text,endTime:text})),overrides:array(object({id:text,date:text,type:oneOf("AVAILABLE","BLOCKED"),allDay:boolean}))});
export const availability = object({venueId:text,timezone:text,dates:array(object({date:text,intervals:array(object({startTime:text,endTime:text}))}))});
export const match = object({brief:text,totalMatches:number,venues:array(object({venue:venueList,score:number,explanation:text,quoteItems:array(object({label:text,amount:number,note:nullable(text)}))}))});
export const message = object({message:text});
export const user = object({id:text,email:text,fullName:text,role:oneOf("SCOUT","OWNER","ADMIN"),active:boolean,emailVerified:boolean});
export const cancellationPreview = object({bookingId:text,canCancel:boolean,refundPercentage:number,refundAmountEur:number,retainedAmountEur:number,previewToken:nullable(text)});
export const override = object({id:text,date:text,type:oneOf("AVAILABLE","BLOCKED"),allDay:boolean});
