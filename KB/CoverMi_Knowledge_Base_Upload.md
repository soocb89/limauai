# CoverMi Knowledge Base Upload

Purpose: upload-ready customer-service knowledge for CoverMi car insurance, road tax renewal, FAQ handling, and system error-code handling.

Global agent rules:
- Use the approved answer/message as the customer-facing response.
- Keep error codes visible in replies when the source message includes a code placeholder.
- If an item is marked `needs_source_review` or `needs_business_review`, do not treat it as final policy until CoverMi confirms it.
- Escalate to CoverMi WhatsApp at 013-435 9113 when the approved message says to contact CoverMi via WhatsApp.
- For insurer claims or roadside assistance, direct the customer to the relevant insurer hotline when listed.

## FAQ Intents

### FAQ-001 - How do I renew my car insurance and road tax with CoverMi?
- Category: Road tax & JPJ
- Intent: `faq_renew_car_insurance_and_road_tax_covermi`
- Status: `ready`
- Example customer phrasing:
  - How do I renew my car insurance and road tax with CoverMi?
- Approved answer:

Simply visit our homepage, select your vehicle, and click "Get Quote." You'll be asked to enter a few basic details such as your vehicle registration number, MyKad (NRIC) or Passport number, and E-mail address. We'll then instantly display competitive quotes from trusted insurance providers, allowing you to compare coverage options and features side by side before choosing the one that best fits your needs.

### FAQ-002 - Can I renew my road tax without insurance?
- Category: Road tax & JPJ
- Intent: `faq_renew_road_tax_without_insurance`
- Status: `ready`
- Example customer phrasing:
  - Can I renew my road tax without insurance?
- Approved answer:

The answer is No. JPJ requires you to have valid motor (as in vehicle) insurance before you can renew your road tax. CoverMi makes this easy by bundling both into one smooth process.

### FAQ-003 - Can I renew if my insurance has already expired?
- Category: Support, complaints & account help
- Intent: `faq_renew_insurance_has_already_expired`
- Status: `ready`
- Example customer phrasing:
  - Can I renew if my insurance has already expired?
- Approved answer:

No, the renewal process becomes more complicated once your insurance has expired, especially if it has lapsed for a long period. You'll need to return to your previous insurance provider to renew it. For example, if your previous insurer was Allianz, you must go back to Allianz. If you wish to switch to another insurance company afterward, you'll still need to follow this process: renew with your previous insurer first, cancel it, and then purchase a new policy with your preferred provider, such as CoverMi.

### FAQ-004 - Which insurance providers does CoverMi work with?
- Category: Renewal & quotation
- Intent: `faq_which_insurance_providers_covermi_work`
- Status: `ready`
- Example customer phrasing:
  - Which insurance providers does CoverMi work with?
- Approved answer:

We partner with Malaysia's leading insurance providers to offer you comprehensive coverage options, including:

Takaful Ikhlas General Berhad

Syarikat Takaful Malaysia Am Berhad

Allianz General Insurance Berhad

Zurich General Takaful Malaysia Berhad

And more insurance partners are coming soon.

### FAQ-005 - What vehicles can I insure through CoverMi?
- Category: Road tax & JPJ
- Intent: `faq_vehicles_insure_through_covermi`
- Status: `ready`
- Example customer phrasing:
  - What vehicles can I insure through CoverMi?
- Approved answer:

Our services cover:

- Private cars

- Motorcycles

Note: For e-hailing vehicles, we currently offer insurance renewal only, without road tax renewal services.

### FAQ-006 - What are the benefits of renewing with CoverMi?
- Category: Payment & transaction
- Intent: `faq_benefits_renewing_covermi`
- Status: `ready`
- Example customer phrasing:
  - What are the benefits of renewing with CoverMi?
- Approved answer:

- Competitive Rates from Multiple Insurers

- Hassle-Free Documentation

- 24/7 Customer Support

- Instant Policy Issuance

- Secure Payment Options

- Authorized Provider

### FAQ-007 - What if I don't remember my insurance and road tax expiry dates?
- Category: Road tax & JPJ
- Intent: `faq_don_t_remember_insurance_and_road_tax`
- Status: `ready`
- Example customer phrasing:
  - What if I don't remember my insurance and road tax expiry dates?
- Approved answer:

We will send automatic reminders via:

- Email notifications

- WhatsApp messages

- SMS alerts

You'll receive notifications ahead of your renewal dates to ensure continuous coverage, so you'll never have to worry about missing an expiry again

### FAQ-008 - What payment methods are available?
- Category: Payment & transaction
- Intent: `faq_payment_methods_available`
- Status: `ready`
- Example customer phrasing:
  - What payment methods are available?
- Approved answer:

For now, we only accept online banking (FPX) and digital wallets. All payments are processed securely through our encrypted payment gateway.

### FAQ-009 - Do you offer instalment payments (BNPL)?
- Category: Payment & transaction
- Intent: `faq_offer_instalment_payments_bnpl`
- Status: `ready`
- Example customer phrasing:
  - Do you offer instalment payments (BNPL)?
- Approved answer:

Yes. This features is coming soon.

We partner with selected Buy Now Pay Later providers such as Atome and PayLater by Grab so you can split your payments into affordable installments. BNPL is also known as Cover Now, Pay Later (CNPL) with CoverMi.

### FAQ-010 - Is my payment secure?
- Category: Payment & transaction
- Intent: `faq_payment_secure`
- Status: `ready`
- Example customer phrasing:
  - Is my payment secure?
- Approved answer:

Absolutely. All transactions on CoverMi are encrypted and processed through compliant payment gateways, ensuring your information is fully protected.

### FAQ-011 - How do I get my insurance documents?
- Category: Payment & transaction
- Intent: `faq_get_insurance_documents`
- Status: `ready`
- Example customer phrasing:
  - How do I get my insurance documents?
- Approved answer:

After successful payment, your insurance documents (both e-Cover Note and e-Policy) will be automatically sent to your registered email address.

### FAQ-012 - Will I receive my road tax sticker?
- Category: Road tax & JPJ
- Intent: `faq_receive_road_tax_sticker`
- Status: `ready`
- Example customer phrasing:
  - Will I receive my road tax sticker?
- Approved answer:

No, physical road tax stickers are no longer mandatory. To support sustainability and reduce waste. We provides digital road tax only.

### FAQ-013 - How do I make an insurance/takaful claim?
- Category: Claims & roadside assistance
- Intent: `faq_make_insurance_takaful_claim`
- Status: `ready`
- Example customer phrasing:
  - How do I make an insurance/takaful claim?
- Approved answer:

In the event of an accident or damage, follow these steps:

1. Document the incident: Take clear photos and note down relevant details.

2. File a police report within 24 hours (if applicable).

3. Contact your insurance provider directly to initiate the claim process.

Insurer Contact Numbers:

Takaful Ikhlas: 1-800-88-1186

Takaful Malaysia: 1-800-888-788

Allianz: 1-800-22-5542

Zurich Takaful: 1-300-88-622

If you're unsure which insurer your policy is under, you may contact us at +603-9212 8311 and we'll help guide you to the right provider.

### FAQ-014 - How long does it take for a claim to be processed?
- Category: Claims & roadside assistance
- Intent: `faq_long_it_take_claim_processed`
- Status: `ready`
- Example customer phrasing:
  - How long does it take for a claim to be processed?
- Approved answer:

Processing time depends on the insurer and the nature of the claim. Minor claims may take a few working days, while accident repairs may take 2-6 weeks depending on workshop availability and parts.

### FAQ-015 - What should I do if my car breaks down or I need a Roadside Assistance?
- Category: Claims & roadside assistance
- Intent: `faq_should_car_breaks_down_or_need_roadside`
- Status: `ready`
- Example customer phrasing:
  - What should I do if my car breaks down or I need a Roadside Assistance?
- Approved answer:

Have no worries, boss  I hope you're safe.

If your policy includes roadside assistance car broke down, tyre puncture, or you're stuck and need towing, please contact your insurer's roadside hotline:

1. Takaful Ikhlas: 1-800-88-1186

2. Syarikat Takaful Malaysia: 1-800-88-8788

3. Zurich Takaful: 1-300-88-5566

4. Allianz: 1-800-22-5542

5. Chubb: 1-300-88-0128

6. Tokio Marine: 1-300-22-1188;

If unsure which insurer you're with, tell me the name and I'll help check it

### FAQ-016 - Can I renew my road tax if I have outstanding summons?
- Category: Road tax & JPJ
- Intent: `faq_renew_road_tax_have_outstanding_summons`
- Status: `ready`
- Example customer phrasing:
  - Can I renew my road tax if I have outstanding summons?
- Approved answer:

During the renewal process, our system automatically checks for any outstanding summons with JPJ and PDRM. To proceed with the renewal, all outstanding traffic summons must be settled first.

### FAQ-017 - How can I contact CoverMi Customer Support?
- Category: Support, complaints & account help
- Intent: `faq_contact_covermi_customer_support`
- Status: `ready`
- Example customer phrasing:
  - How can I contact CoverMi Customer Support?
- Approved answer:

May I know any issue you encountered? I will be here to assist you. Alternatively, you may contact us at the following channel:

Phone: +603-9212 8311

E-mail: cs.support@covermi.my

Our Operating hours: Monday - Friday, 11.00 AM - 8.00PM. Excluding public holidays.

### FAQ-018 - Are CoverMi's online services available 24/7?
- Category: Support, complaints & account help
- Intent: `faq_covermi_s_online_services_available_24_7`
- Status: `ready`
- Example customer phrasing:
  - Are CoverMi's online services available 24/7?
- Approved answer:

Yes, our online platform is available 24/7, allowing you to get quotes, renew policies, and access support services at any time, including weekends and public holidays.

### FAQ-019 - How do I file a complaint?
Answers: May I understand what happened? Let me help you on this.
- Category: Support, complaints & account help
- Intent: `faq_file_complaint_answers_may_understand_happened_let`
- Status: `ready`
- Example customer phrasing:
  - How do I file a complaint?
Answers: May I understand what happened? Let me help you on this.
- Approved answer:



### FAQ-020 - What is CoverMi's refund policy?
- Category: Policy documents
- Intent: `faq_covermi_s_refund_policy`
- Status: `ready`
- Example customer phrasing:
  - What is CoverMi's refund policy?
- Approved answer:

To request refund, below are the condition and process:

1. Refund requests must be made within 24 hours of policy purchase

2. Requests will be processed within 1-2 working days

3. For policies where e-Cover notes have been issued, refund requests must be made directly to the respective insurance provider.

### FAQ-021 - Can I cancel my policy anytime?
- Category: Policy documents
- Intent: `faq_cancel_policy_anytime`
- Status: `ready`
- Example customer phrasing:
  - Can I cancel my policy anytime?
- Approved answer:

Yes, you may cancel your policy after purchase; however, refunds are subject to the insurer's cancellation terms. Policies with an active e-Cover Note typically require you to request cancellation directly from the insurer. While CoverMi cannot process cancellations on your behalf, we can guide you to the right contact for assistance.

### FAQ-022 - What if I made a mistake in my policy details?
- Category: Support, complaints & account help
- Intent: `faq_made_mistake_in_policy_details`
- Status: `ready`
- Example customer phrasing:
  - What if I made a mistake in my policy details?
- Approved answer:

May I know what info need to be correct? Any minor details (such as email, phone number, address) can often be corrected quickly.

For major details (such as car plate number, vehicle info), adjustments may require insurer approval.

### FAQ-023 - Why is my payment rejected?
- Category: Payment & transaction
- Intent: `faq_why_payment_rejected`
- Status: `ready`
- Example customer phrasing:
  - Why is my payment rejected?
- Approved answer:

May I know what error messages show up? So I can check further from our end.

Below are the common reasons if payment is rejected:

Credit card verification issues

System interruptions

Bank processing errors

- Notes: Intent is to diagnose the customer's specific payment error. Ask for the exact error message or code, then check it against payment or response-code knowledge before replying.

### FAQ-024 - How do I get the best car insurance?
- Category: Renewal & quotation
- Intent: `faq_get_best_car_insurance`
- Status: `ready`
- Example customer phrasing:
  - How do I get the best car insurance?
- Approved answer:

We help you find the best insurance by:

Comparing quotes from multiple insurers

Showing transparent coverage details and premiums

Offering customization options to match your needs

Providing expert advice through our customer service team

### FAQ-025 - Do you offer No Claim Discount (NCD)?
- Category: Claims & roadside assistance
- Intent: `faq_offer_no_claim_discount_ncd`
- Status: `ready`
- Example customer phrasing:
  - Do you offer No Claim Discount (NCD)?
- Approved answer:

Yes. We honour the NCD system. You'll automatically receive a discount on your premium if you haven't made any claims during your previous policy period. The NCD percentage increases with each claim-free year, up to 55%.

### FAQ-026 - How do I transfer my NCD from another insurer?
- Category: Coverage, NCD & add-ons
- Intent: `faq_transfer_ncd_from_another_insurer`
- Status: `ready`
- Example customer phrasing:
  - How do I transfer my NCD from another insurer?
- Approved answer:

In most cases, you don't need to transfer your NCD manually.

If you're renewing because your policy is due to expire, you can compare and purchase through CoverMi in advance. Your new policy will start on the same date your existing policy ends, and your NCD will be transferred and confirmed automatically.

Manual NCD transfer is only required if you choose to terminate your policy early and switch insurers. Otherwise, no action is needed from you.

### FAQ-027 - Can I protect my NCD?
- Category: Claims & roadside assistance
- Intent: `faq_protect_ncd`
- Status: `ready`
- Example customer phrasing:
  - Can I protect my NCD?
- Approved answer:

Yes, some insurers offer an NCD Protector add-on. This feature allows you to make one claim per year without losing your NCD entitlement. You can choose to include it as an optional add-on when selecting your coverage.

### FAQ-028 - Can I adjust my sum insured?
- Category: Support, complaints & account help
- Intent: `faq_adjust_sum_insured`
- Status: `ready`
- Example customer phrasing:
  - Can I adjust my sum insured?
- Approved answer:

Yes. You can adjust your sum insured within a reasonable range based on your vehicle's current market value by clicking "Edit" at the Policy Info after you selected your preferred insurance provider.

If your policy is already active, the adjustment will require an endorsement (an official amendment to your policy). In some cases, you may need to cancel the existing policy and purchase a new one.

### FAQ-029 - Is CoverMi licensed by Bank Negara Malaysia?
- Category: Trust, compliance & brand
- Intent: `faq_covermi_licensed_by_bank_negara_malaysia`
- Status: `ready`
- Example customer phrasing:
  - Is CoverMi licensed by Bank Negara Malaysia?
- Approved answer:

CoverMi operates in partnership with M Advisory, and works exclusively with insurers and Takaful operators licensed and regulated by Bank Negara Malaysia, through PIAM (Persatuan Insurans Am Malaysia), for general insurers and MTA (Malaysian Takaful Association) for Takaful providers. This ensures that all policies purchased through CoverMi are valid, legal, and fully recognised by the authorities.

### FAQ-030 - Are policies bought on CoverMi recognized by JPJ?
- Category: Policy documents
- Intent: `faq_policies_bought_covermi_recognized_by_jpj`
- Status: `ready`
- Example customer phrasing:
  - Are policies bought on CoverMi recognized by JPJ?
- Approved answer:

Yes. All policies issued via CoverMi are valid and recognized by JPJ, and the e-Cover note generated is accepted for road tax renewal.

### FAQ-031 - Can I renew on behalf of someone else?
- Category: Road tax & JPJ
- Intent: `faq_renew_behalf_someone_else`
- Status: `ready`
- Example customer phrasing:
  - Can I renew on behalf of someone else?
- Approved answer:

Yes. If you have the required details (vehicle number, NRIC/Passport, and postcode), you can renew insurance and road tax for family members, friends, or company vehicles.

### FAQ-032 - Will I receive a receipt for my payment?
- Category: Payment & transaction
- Intent: `faq_receive_receipt_payment`
- Status: `ready`
- Example customer phrasing:
  - Will I receive a receipt for my payment?
- Approved answer:

Yes, you'll receive an e-Receipt via email for every successful transaction. Please keep this for your records.

### FAQ-033 - How do I know if my transaction was successful?
- Category: Payment & transaction
- Intent: `faq_know_transaction_was_successful`
- Status: `ready`
- Example customer phrasing:
  - How do I know if my transaction was successful?
- Approved answer:

You'll know your transaction was successful if:

- You receive an immediate confirmation email

- An e-Services receipt is issued

- For insurance policies, you'll receive an e-Cover note and e-Policy

### FAQ-034 - Would foreigner need to pay more while renew with CoverMi?
- Category: Renewal & quotation
- Intent: `faq_would_foreigner_need_pay_more_while_renew`
- Status: `ready`
- Example customer phrasing:
  - Would foreigner need to pay more while renew with CoverMi?
- Approved answer:

Foreigner who owns a car in Malaysia will not need to pay extra. The premium might be different based on add on and other factors subject to the insurer's review.

### FAQ-035 - Why I didn't hear you before?
- Category: Trust, compliance & brand
- Intent: `faq_why_didn_t_hear_before`
- Status: `ready`
- Example customer phrasing:
  - Why I didn't hear you before?
- Approved answer:

Use one of the approved answer variants below. Do not send all variants together. Choose the version that best matches the tone of the conversation.

- Approved answer variants (choose one only):

Variant 1:

CoverMi has been in the market since 2024. We began on a smaller scale and have been expanding gradually, so more customers are only starting to hear about us as we grow.

Variant 2:

CoverMi was founded in 2024. We spent our early period strengthening partnerships with insurers and improving our digital platform, which is why our brand exposure has increased more recently.

Variant 3:

CoverMi started in 2024. We focused more on building the service and working with trusted insurance partners first, so you may be hearing about us more now rather than earlier.

- Notes: Original FAQ contains three alternative approved answers; chatbot should select one, not concatenate them.

### FAQ-036 - Can I select No for E-hailing even I drive for E-hailing use?
- Category: Claims & roadside assistance
- Intent: `faq_select_no_e_hailing_even_drive_e`
- Status: `ready`
- Example customer phrasing:
  - Can I select No for E-hailing even I drive for E-hailing use?
- Approved answer:

E-hailing insurance is compulsory because driving for Grab, Bolt, AirAsia Ride, or Maxim is considered commercial use. Private insurance only covers personal driving. E-hailing coverage makes sure your claims are valid if anything happens while you're working.

### FAQ-037 - What's the difference of Agreed Value and Market Value?
- Category: Coverage, NCD & add-ons
- Intent: `faq_s_difference_agreed_value_and_market_value`
- Status: `ready`
- Example customer phrasing:
  - What's the difference of Agreed Value and Market Value?
- Approved answer:

Market Value means your car is insured for its current market value at the time of renewal. This value changes over time.

Agreed Value means you and the insurer agree on a fixed sum insured for your car, which remains constant throughout the policy period.

Let me summarize for you. If your car being stolen or totalled, Agreed Value gives you a fixed payout amount, while Market Value gives you a payout amount depends on your car's worth at the time of the incident.

## Senang Error Code Intents

### ERR-SENANG-SNG001 - SNG001
- Category: Renewal status
- Intent: `error_senang_sng001`
- Status: `ready`
- Trigger: I got error SNG001; Your vehicle has already been renewed. Please check with Insurance Provider or contact the customer service team for a personalised quote.
- Agent action: Explain that the vehicle appears already renewed and guide the customer to their insurer or support.
- Approved customer message:

Vehicle already renewed.

Your vehicle has already been renewed. Please contact your insurance provider if you need help.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG002 - SNG002
- Category: Renewal timing
- Intent: `error_senang_sng002`
- Status: `ready`
- Trigger: I got error SNG002; Your policy isn't expiring soon (expiry date)
- Agent action: Tell the customer renewal is too early and ask them to return within the renewal window.
- Approved customer message:

Too early to renew.

Your policy is not expiring soon. Please check back as early as 60 days before expiry date.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG003 - SNG003
- Category: Identity / vehicle validation
- Intent: `error_senang_sng003`
- Status: `ready`
- Trigger: I got error SNG003; The combination of NRIC and Vehicle Number is not correct
- Agent action: Ask the customer to verify NRIC or passport number and vehicle registration, then retry.
- Approved customer message:

ID and vehicle mismatch.

Your ID number and vehicle number don't match. Please check your details and try again.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG004 - SNG004
- Category: Temporary system issue
- Intent: `error_senang_sng004`
- Status: `ready`
- Trigger: I got error SNG004; We're sorry, we can't process your request online at the moment.
- Agent action: Ask the customer to retry after 5 minutes; escalate to CoverMi WhatsApp if it persists.
- Approved customer message:

Oops! Something went wrong.

Please try again in 5 minutes. If the issue persists, contact us on CoverMi WhatsApp at 013-435 9113.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG005 - SNG005
- Category: Vehicle eligibility
- Intent: `error_senang_sng005`
- Status: `ready`
- Trigger: I got error SNG005; Your vehicle has exceeded the renewal age limit.
- Agent action: Explain that the vehicle is outside online renewal eligibility.
- Approved customer message:

Vehicle exceeds renewal age.

We're unable to process the request. Your vehicle has exceeded the renewal age limit. [{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG006 - SNG006
- Category: Vehicle lookup
- Intent: `error_senang_sng006`
- Status: `ready`
- Trigger: I got error SNG006; You cannot purchase insurance online as the age range of the vehicle owner and the vehicle is not available in the system.
- Agent action: Ask the customer to check vehicle details and retry.
- Approved customer message:

Vehicle not found.

We couldn't find any matching vehicle details. Please check your details and try again.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG007 - SNG007
- Category: Identity / vehicle validation
- Intent: `error_senang_sng007`
- Status: `ready`
- Trigger: I got error SNG007; The values entered does not match with JPJ Data. Please ensure that the ID Number and Vehicle Number are the same. Alternatively, please contact the customer service team for a personalised quote.
- Agent action: Ask the customer to verify NRIC or passport number and vehicle registration, then retry.
- Approved customer message:

ID and vehicle mismatch.

The ID number and vehicle number don't match. Please check your details and try again.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG007E - SNG007E
- Category: Temporary system issue
- Intent: `error_senang_sng007e`
- Status: `ready`
- Trigger: I got error SNG007E; Your vehicle is pending confirmation for JPJ approval. Please contact the customer service team to find out the status of approval.
- Agent action: Ask the customer to retry after 5 minutes; escalate to CoverMi WhatsApp if it persists.
- Approved customer message:

Oops! Something went wrong.

Please try again in 5 minutes. If the issue persists, contact us on CoverMi WhatsApp at 013-435 9113.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG008 - SNG008
- Category: Vehicle lookup
- Intent: `error_senang_sng008`
- Status: `ready`
- Trigger: I got error SNG008; Your vehicle is not available for online quotation. Please contact customer service team for a personalised quote.
- Agent action: Ask the customer to check vehicle details and retry.
- Approved customer message:

Vehicle not found.

We couldn't find any matching vehicle details. Please check your details and try again.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG009 - SNG009
- Category: General error
- Intent: `error_senang_sng009`
- Status: `ready`
- Trigger: I got error SNG009; The takaful contribution quotation will be different as the quote validity has expired. Please contact customer service team if you have further questions.
- Agent action: Use the approved message and escalate if the customer cannot proceed.
- Approved customer message:

Quote expired.

Please request a new quotation to continue.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG010 - SNG010
- Category: Temporary system issue
- Intent: `error_senang_sng010`
- Status: `ready`
- Trigger: I got error SNG010; The system is currently down. Please contact customer service team for a personalised quote.
- Agent action: Ask the customer to retry after 5 minutes; escalate to CoverMi WhatsApp if it persists.
- Approved customer message:

Oops! Something went wrong.

Please try again in 5 minutes. If the issue persists, contact us on CoverMi WhatsApp at 013-435 9113.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG011 - SNG011
- Category: General error
- Intent: `error_senang_sng011`
- Status: `ready`
- Trigger: I got error SNG011; Unable to issue the insurance policy because the vehicle is currently blacklisted or the cover note has been canceled. Please contact customer service team for a personalised quote.-
- Agent action: Use the approved message and escalate if the customer cannot proceed.
- Approved customer message:

Policy couldn't be issued.

The vehicle is blacklisted or the cover note has been canceled. Contact us on CoverMi WhatsApp at 013-435 9113 for assistance.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG013 - SNG013
- Category: General error
- Intent: `error_senang_sng013`
- Status: `ready`
- Trigger: I got error SNG013; Your payment is successful.
- Agent action: Use the approved message and escalate if the customer cannot proceed.
- Approved customer message:

Payment successful.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG014 - SNG014
- Category: Temporary system issue
- Intent: `error_senang_sng014`
- Status: `ready`
- Trigger: I got error SNG014; System is currently processing your request. Please be patient and do not refresh the page.
- Agent action: Ask the customer to retry after 5 minutes; escalate to CoverMi WhatsApp if it persists.
- Approved customer message:

Processing your request.

This may take a moment. Please don't close or refresh this page.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG015 - SNG015
- Category: General error
- Intent: `error_senang_sng015`
- Status: `ready`
- Trigger: I got error SNG015; Your payment is successful, but we are unable to generate invoice no. SNGV10. Please contact customer service team for a personalised quote.
- Agent action: Use the approved message and escalate if the customer cannot proceed.
- Approved customer message:

Payment successful.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG016 - SNG016
- Category: General error
- Intent: `error_senang_sng016`
- Status: `ready`
- Trigger: I got error SNG016; Cover type is not supported.
- Agent action: Use the approved message and escalate if the customer cannot proceed.
- Approved customer message:

Cover type not supported.

This cover type isn't supported. Please check your details and try again.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG017 - SNG017
- Category: Manual approval required
- Intent: `error_senang_sng017`
- Status: `internal_only_do_not_publish`
- Trigger: I got error SNG017; Prior approval is required for this vehicle model.
- Agent action: Escalate to CoverMi support because manual insurer approval is required.
- Approved customer message:

Do not show this as a customer-facing chatbot response. This code is out of scope for the customer journey and is not expected to appear on the customer side. Route internally if it appears.

- Notes: Should be out of scope.

Due to manual request from Senang required and it will not created in CoverMi back office.

### ERR-SENANG-SNG019 - SNG019
- Category: Sum insured
- Intent: `error_senang_sng019`
- Status: `ready`
- Trigger: I got error SNG019; The value of sum insured is out of range.
- Agent action: Ask the customer to adjust the sum insured within the allowed range.
- Approved customer message:

Sum insured out of range.

Please adjust the sum insured and try again.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNG020 - SNG020
- Category: Duplicate transaction
- Intent: `error_senang_sng020`
- Status: `ready`
- Trigger: I got error SNG020; Duplicate transaction
- Agent action: Ask the customer to check policy or transaction status before trying again.
- Approved customer message:

Duplicate transaction.

Please check your policy status or contact us on CoverMi WhatsApp at 013-435 9113 for assistance.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNGV01 - SNGV01
- Category: Missing or invalid input
- Intent: `error_senang_sngv01`
- Status: `ready`
- Trigger: I got error SNGV01; The values of the required field is empty.
- Agent action: Ask the customer to complete missing fields and follow the required format.
- Approved customer message:

Incomplete info.

Some details are missing or incomplete. Please check your details and try again.

[{senang code}]

- Notes: Ok to proceed

### ERR-SENANG-SNGV02 - SNGV02
- Category: Missing or invalid input
- Intent: `error_senang_sngv02`
- Status: `ready`
- Trigger: I got error SNGV02; The required field is incomplete. Please follow the sample format to get a quotation, or contact customer service team for a personalised quote.
- Agent action: Ask the customer to complete missing fields and follow the required format.
- Approved customer message:

Incomplete info.

Some details are missing or incomplete. Please check your details and try again.

[{senang code}]

- Notes: Ok to proceed

## Platform Response Code Intents

### ERR-RESPONSE-100000 - 100000 / success
- Category: General
- Intent: `error_response_success`
- Status: `ready`
- Trigger: I got error code 100000; SUCCESS
- Agent action: No troubleshooting needed; proceed with the customer journey.
- Approved customer message:

Request Success

- Notes: ok to proceed

### ERR-RESPONSE-100001 - 100001 / general_failure
- Category: General
- Intent: `error_response_general_failure`
- Status: `ready`
- Trigger: I got error code 100001; GENERAL_FAILURE
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100002 - 100002 / access_denied
- Category: General
- Intent: `error_response_access_denied`
- Status: `ready`
- Trigger: I got error code 100002; ACCESS_DENIED
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100003 - 100003 / invalid_token
- Category: General
- Intent: `error_response_invalid_token`
- Status: `ready`
- Trigger: I got error code 100003; INVALID_TOKEN
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100004 - 100004 / resource_not_found
- Category: General
- Intent: `error_response_resource_not_found`
- Status: `ready`
- Trigger: I got error code 100004; RESOURCE_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100005 - 100005 / method_not_allow
- Category: General
- Intent: `error_response_method_not_allow`
- Status: `ready`
- Trigger: I got error code 100005; METHOD_NOT_ALLOW
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100006 - 100006 / encryption_failed
- Category: General
- Intent: `error_response_encryption_failed`
- Status: `ready`
- Trigger: I got error code 100006; ENCRYPTION_FAILED
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100007 - 100007 / decryption_failed
- Category: General
- Intent: `error_response_decryption_failed`
- Status: `ready`
- Trigger: I got error code 100007; DECRYPTION_FAILED
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100008 - 100008 / parameter_missing
- Category: General
- Intent: `error_response_parameter_missing`
- Status: `ready`
- Trigger: I got error code 100008; PARAMETER_MISSING
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100009 - 100009 / outdated_data_locking
- Category: General
- Intent: `error_response_outdated_data_locking`
- Status: `ready`
- Trigger: I got error code 100009; OUTDATED_DATA_LOCKING
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100010 - 100010 / invalid_parameter
- Category: General
- Intent: `error_response_invalid_parameter`
- Status: `ready`
- Trigger: I got error code 100010; INVALID_PARAMETER
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100011 - 100011 / feature_disabled
- Category: General
- Intent: `error_response_feature_disabled`
- Status: `ready`
- Trigger: I got error code 100011; FEATURE_DISABLED
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-100012 - 100012 / credential_empty
- Category: General
- Intent: `error_response_credential_empty`
- Status: `ready`
- Trigger: I got error code 100012; CREDENTIAL_EMPTY
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-110000 - 110000 / token_not_found
- Category: Token Validate
- Intent: `error_response_token_not_found`
- Status: `ready`
- Trigger: I got error code 110000; TOKEN_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-110001 - 110001 / token_expired
- Category: Token Validate
- Intent: `error_response_token_expired`
- Status: `ready`
- Trigger: I got error code 110001; TOKEN_EXPIRED
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-110002 - 110002 / token_attempt_time_maximum
- Category: Token Validate
- Intent: `error_response_token_attempt_time_maximum`
- Status: `ready`
- Trigger: I got error code 110002; TOKEN_ATTEMPT_TIME_MAXIMUM
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-110003 - 110003 / token_invalid
- Category: Token Validate
- Intent: `error_response_token_invalid`
- Status: `ready`
- Trigger: I got error code 110003; TOKEN_INVALID
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-110004 - 110004 / unsupported_otp_method
- Category: Token Validate
- Intent: `error_response_unsupported_otp_method`
- Status: `ready`
- Trigger: I got error code 110004; UNSUPPORTED_OTP_METHOD
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-110005 - 110005 / token_not_resend
- Category: Token Validate
- Intent: `error_response_token_not_resend`
- Status: `ready`
- Trigger: I got error code 110005; TOKEN_NOT_RESEND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-200001 - 200001 / email_wrong_format
- Category: Validation - Email
- Intent: `error_response_email_wrong_format`
- Status: `ready`
- Trigger: I got error code 200001; EMAIL_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-210001 - 210001 / phone_wrong_format
- Category: Validation - Phone
- Intent: `error_response_phone_wrong_format`
- Status: `ready`
- Trigger: I got error code 210001; PHONE_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-220001 - 220001 / date_wrong_format
- Category: Validation - Date
- Intent: `error_response_date_wrong_format`
- Status: `ready`
- Trigger: I got error code 220001; DATE_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-300001 - 300001 / file_invalid_extension
- Category: File
- Intent: `error_response_file_invalid_extension`
- Status: `ready`
- Trigger: I got error code 300001; FILE_INVALID_EXTENSION
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-300002 - 300002 / file_not_found
- Category: File
- Intent: `error_response_file_not_found`
- Status: `ready`
- Trigger: I got error code 300002; FILE_NOT_FOUND
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-310001 - 310001 / file_upload_fail
- Category: Upload File
- Intent: `error_response_file_upload_fail`
- Status: `ready`
- Trigger: I got error code 310001; FILE_UPLOAD_FAIL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-310002 - 310002 / file_maximum_file_size
- Category: Upload File
- Intent: `error_response_file_maximum_file_size`
- Status: `ready`
- Trigger: I got error code 310002; FILE_MAXIMUM_FILE_SIZE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-320001 - 320001 / export_request_not_found
- Category: Export File
- Intent: `error_response_export_request_not_found`
- Status: `ready`
- Trigger: I got error code 320001; EXPORT_REQUEST_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-320002 - 320002 / export_request_not_ready
- Category: Export File
- Intent: `error_response_export_request_not_ready`
- Status: `ready`
- Trigger: I got error code 320002; EXPORT_REQUEST_NOT_READY
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-320003 - 320003 / export_request_progressing
- Category: Export File
- Intent: `error_response_export_request_progressing`
- Status: `ready`
- Trigger: I got error code 320003; EXPORT_REQUEST_PROGRESSING
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-400001 - 400001 / company_contact_not_unique
- Category: Company
- Intent: `error_response_company_contact_not_unique`
- Status: `ready`
- Trigger: I got error code 400001; COMPANY_CONTACT_NOT_UNIQUE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-400002 - 400002 / company_name_not_null
- Category: Company
- Intent: `error_response_company_name_not_null`
- Status: `ready`
- Trigger: I got error code 400002; COMPANY_NAME_NOT_NULL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-400003 - 400003 / company_profile_not_null
- Category: Company
- Intent: `error_response_company_profile_not_null`
- Status: `ready`
- Trigger: I got error code 400003; COMPANY_PROFILE_NOT_NULL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-400004 - 400004 / company_status_not_valid
- Category: Company
- Intent: `error_response_company_status_not_valid`
- Status: `ready`
- Trigger: I got error code 400004; COMPANY_STATUS_NOT_VALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-400005 - 400005 / company_not_unique
- Category: Company
- Intent: `error_response_company_not_unique`
- Status: `ready`
- Trigger: I got error code 400005; COMPANY_NOT_UNIQUE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-400006 - 400006 / company_not_found
- Category: Company
- Intent: `error_response_company_not_found`
- Status: `ready`
- Trigger: I got error code 400006; COMPANY_NOT_FOUND
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-410001 - 410001 / company_department_not_unique
- Category: Company Department
- Intent: `error_response_company_department_not_unique`
- Status: `ready`
- Trigger: I got error code 410001; COMPANY_DEPARTMENT_NOT_UNIQUE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-410002 - 410002 / department_name_not_null
- Category: Company Department
- Intent: `error_response_department_name_not_null`
- Status: `ready`
- Trigger: I got error code 410002; DEPARTMENT_NAME_NOT_NULL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-410003 - 410003 / department_status_not_valid
- Category: Company Department
- Intent: `error_response_department_status_not_valid`
- Status: `ready`
- Trigger: I got error code 410003; DEPARTMENT_STATUS_NOT_VALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-410004 - 410004 / department_not_null
- Category: Company Department
- Intent: `error_response_department_not_null`
- Status: `ready`
- Trigger: I got error code 410004; DEPARTMENT_NOT_NULL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-420001 - 420001 / role_name_not_null
- Category: Role
- Intent: `error_response_role_name_not_null`
- Status: `ready`
- Trigger: I got error code 420001; ROLE_NAME_NOT_NULL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-420002 - 420002 / role_not_unique
- Category: Role
- Intent: `error_response_role_not_unique`
- Status: `ready`
- Trigger: I got error code 420002; ROLE_NOT_UNIQUE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-420003 - 420003 / role_status_not_valid
- Category: Role
- Intent: `error_response_role_status_not_valid`
- Status: `ready`
- Trigger: I got error code 420003; ROLE_STATUS_NOT_VALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-420004 - 420004 / role_not_found
- Category: Role
- Intent: `error_response_role_not_found`
- Status: `ready`
- Trigger: I got error code 420004; ROLE_NOT_FOUND
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430001 - 430001 / user_not_unique
- Category: User
- Intent: `error_response_user_not_unique`
- Status: `ready`
- Trigger: I got error code 430001; USER_NOT_UNIQUE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430002 - 430002 / user_status_not_valid
- Category: User
- Intent: `error_response_user_status_not_valid`
- Status: `ready`
- Trigger: I got error code 430002; USER_STATUS_NOT_VALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430003 - 430003 / user_name_not_null
- Category: User
- Intent: `error_response_user_name_not_null`
- Status: `ready`
- Trigger: I got error code 430003; USER_NAME_NOT_NULL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430004 - 430004 / user_password_not_null
- Category: User
- Intent: `error_response_user_password_not_null`
- Status: `ready`
- Trigger: I got error code 430004; USER_PASSWORD_NOT_NULL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430005 - 430005 / user_login_not_null
- Category: User
- Intent: `error_response_user_login_not_null`
- Status: `ready`
- Trigger: I got error code 430005; USER_LOGIN_NOT_NULL
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430006 - 430006 / user_credential_wrong
- Category: User
- Intent: `error_response_user_credential_wrong`
- Status: `ready`
- Trigger: I got error code 430006; USER_CREDENTIAL_WRONG
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Please verify your details and try again. If issue persist, kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-430007 - 430007 / user_password_pattern_invalid
- Category: User
- Intent: `error_response_user_password_pattern_invalid`
- Status: `ready`
- Trigger: I got error code 430007; USER_PASSWORD_PATTERN_INVALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430008 - 430008 / user_contact_not_found
- Category: User
- Intent: `error_response_user_contact_not_found`
- Status: `ready`
- Trigger: I got error code 430008; USER_CONTACT_NOT_FOUND
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430009 - 430009 / user_account_not_verified
- Category: User
- Intent: `error_response_user_account_not_verified`
- Status: `ready`
- Trigger: I got error code 430009; USER_ACCOUNT_NOT_VERIFIED
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-430010 - 430010 / user_account_locked
- Category: User
- Intent: `error_response_user_account_locked`
- Status: `ready`
- Trigger: I got error code 430010; USER_ACCOUNT_LOCKED
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-440001 - 440001 / banner_status_not_valid
- Category: Banner
- Intent: `error_response_banner_status_not_valid`
- Status: `ready`
- Trigger: I got error code 440001; BANNER_STATUS_NOT_VALID
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-450001 - 450001 / user_rs_token_invalid
- Category: User Reset Password
- Intent: `error_response_user_rs_token_invalid`
- Status: `ready`
- Trigger: I got error code 450001; USER_RS_TOKEN_INVALID
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-450002 - 450002 / user_rs_temp_pass_invalid
- Category: User Reset Password
- Intent: `error_response_user_rs_temp_pass_invalid`
- Status: `ready`
- Trigger: I got error code 450002; USER_RS_TEMP_PASS_INVALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-460001 - 460001 / user_password_not_match
- Category: User Password
- Intent: `error_response_user_password_not_match`
- Status: `ready`
- Trigger: I got error code 460001; USER_PASSWORD_NOT_MATCH
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-460002 - 460002 / user_token_expired
- Category: User Password
- Intent: `error_response_user_token_expired`
- Status: `ready`
- Trigger: I got error code 460002; USER_TOKEN_EXPIRED
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-460003 - 460003 / user_token_invalid
- Category: User Password
- Intent: `error_response_user_token_invalid`
- Status: `ready`
- Trigger: I got error code 460003; USER_TOKEN_INVALID
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-460004 - 460004 / user_password_invalid_format
- Category: User Password
- Intent: `error_response_user_password_invalid_format`
- Status: `ready`
- Trigger: I got error code 460004; USER_PASSWORD_INVALID_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-500001 - 500001 / vehicle_plate_number_not_valid
- Category: Vehicle
- Intent: `error_response_vehicle_plate_number_not_valid`
- Status: `ready`
- Trigger: I got error code 500001; VEHICLE_PLATE_NUMBER_NOT_VALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500002 - 500002 / req_applicant_wrong_format
- Category: Request
- Intent: `error_response_req_applicant_wrong_format`
- Status: `ready`
- Trigger: I got error code 500002; REQ_APPLICANT_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500003 - 500003 / unknown_contact_type
- Category: Request
- Intent: `error_response_unknown_contact_type`
- Status: `ready`
- Trigger: I got error code 500003; UNKNOWN_CONTACT_TYPE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500004 - 500004 / req_quotation_setting_wrong_format
- Category: Request
- Intent: `error_response_req_quotation_setting_wrong_format`
- Status: `ready`
- Trigger: I got error code 500004; REQ_QUOTATION_SETTING_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500007 - 500007 / pref_time_wrong_format
- Category: Request
- Intent: `error_response_pref_time_wrong_format`
- Status: `ready`
- Trigger: I got error code 500007; PREF_TIME_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500008 - 500008 / date_cannot_be_past_date
- Category: Request
- Intent: `error_response_date_cannot_be_past_date`
- Status: `ready`
- Trigger: I got error code 500008; DATE_CANNOT_BE_PAST_DATE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500009 - 500009 / missing_name_or_wrong_format
- Category: Request
- Intent: `error_response_missing_name_or_wrong_format`
- Status: `ready`
- Trigger: I got error code 500009; MISSING_NAME_OR_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500010 - 500010 / missing_dob_or_wrong_format
- Category: Request
- Intent: `error_response_missing_dob_or_wrong_format`
- Status: `ready`
- Trigger: I got error code 500010; MISSING_DOB_OR_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500011 - 500011 / missing_nationality_or_wrong_format
- Category: Request
- Intent: `error_response_missing_nationality_or_wrong_format`
- Status: `ready`
- Trigger: I got error code 500011; MISSING_NATIONALITY_OR_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500012 - 500012 / missing_id_type_or_wrong_format
- Category: Request
- Intent: `error_response_missing_id_type_or_wrong_format`
- Status: `ready`
- Trigger: I got error code 500012; MISSING_ID_TYPE_OR_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500013 - 500013 / missing_id_data_or_wrong_format
- Category: Request
- Intent: `error_response_missing_id_data_or_wrong_format`
- Status: `ready`
- Trigger: I got error code 500013; MISSING_ID_DATA_OR_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500014 - 500014 / postcode_missing_or_wrong_format
- Category: Request
- Intent: `error_response_postcode_missing_or_wrong_format`
- Status: `ready`
- Trigger: I got error code 500014; POSTCODE_MISSING_OR_WRONG_FORMAT
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500015 - 500015 / quotation_expired
- Category: Quotation
- Intent: `error_response_quotation_expired`
- Status: `ready`
- Trigger: I got error code 500015; QUOTATION_EXPIRED
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please create new quotation.

- Notes: ok to proceed

### ERR-RESPONSE-500016 - 500016 / quotation_not_found
- Category: Quotation
- Intent: `error_response_quotation_not_found`
- Status: `ready`
- Trigger: I got error code 500016; QUOTATION_NOT_FOUND
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Please verify your details and try again. [{code}]

- Notes: ok to proceed

### ERR-RESPONSE-500017 - 500017 / quotation_covernote_address_too_long
- Category: Quotation
- Intent: `error_response_quotation_covernote_address_too_long`
- Status: `ready`
- Trigger: I got error code 500017; QUOTATION_COVERNOTE_ADDRESS_TOO_LONG
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500018 - 500018 / quotation_vehicle_age_not_support_cover_type
- Category: Quotation
- Intent: `error_response_quotation_vehicle_age_not_support_cover_type`
- Status: `ready`
- Trigger: I got error code 500018; QUOTATION_VEHICLE_AGE_NOT_SUPPORT_COVER_TYPE
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-500019 - 500019 / quotation_driver_age_limit_exceed
- Category: Quotation
- Intent: `error_response_quotation_driver_age_limit_exceed`
- Status: `ready`
- Trigger: I got error code 500019; QUOTATION_DRIVER_AGE_LIMIT_EXCEED
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Driver age exceeded limit.

- Notes: ok to proceed

### ERR-RESPONSE-600001 - 600001 / quotation_generate_quotation_success
- Category: Quotation Response Success
- Intent: `error_response_quotation_generate_quotation_success`
- Status: `ready`
- Trigger: I got error code 600001; QUOTATION_GENERATE_QUOTATION_SUCCESS
- Agent action: No troubleshooting needed; proceed with the customer journey.
- Approved customer message:

Request Success

- Notes: ok to proceed

### ERR-RESPONSE-600002 - 600002 / quotation_update_success
- Category: Quotation Response Success
- Intent: `error_response_quotation_update_success`
- Status: `ready`
- Trigger: I got error code 600002; QUOTATION_UPDATE_SUCCESS
- Agent action: No troubleshooting needed; proceed with the customer journey.
- Approved customer message:

Request Success

- Notes: ok to proceed

### ERR-RESPONSE-600003 - 600003 / quotation_update_personal_info_success
- Category: Quotation Response Success
- Intent: `error_response_quotation_update_personal_info_success`
- Status: `ready`
- Trigger: I got error code 600003; QUOTATION_UPDATE_PERSONAL_INFO_SUCCESS
- Agent action: No troubleshooting needed; proceed with the customer journey.
- Approved customer message:

Request Success

- Notes: ok to proceed

### ERR-RESPONSE-600004 - 600004 / quotation_issue_policy_success
- Category: Quotation Response Success
- Intent: `error_response_quotation_issue_policy_success`
- Status: `ready`
- Trigger: I got error code 600004; QUOTATION_ISSUE_POLICY_SUCCESS
- Agent action: No troubleshooting needed; proceed with the customer journey.
- Approved customer message:

Request Success

- Notes: ok to proceed

### ERR-RESPONSE-600010 - 600010 / quotation_provider_validation_error_id_car
- Category: Quotation Response Error
- Intent: `error_response_quotation_provider_validation_error_id_car`
- Status: `ready`
- Trigger: I got error code 600010; QUOTATION_PROVIDER_VALIDATION_ERROR_ID_CAR
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Please verify your details and try again. If issue persist, kindly reach out to our customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-600011 - 600011 / quotation_provider_request_renewed_car
- Category: Quotation Response Error
- Intent: `error_response_quotation_provider_request_renewed_car`
- Status: `ready`
- Trigger: I got error code 600011; QUOTATION_PROVIDER_REQUEST_RENEWED_CAR
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-600013 - 600013 / quotation_provider_request_route_cs
- Category: Quotation Response Error
- Intent: `error_response_quotation_provider_request_route_cs`
- Status: `ready`
- Trigger: I got error code 600013; QUOTATION_PROVIDER_REQUEST_ROUTE_CS
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-600099 - 600099 / quotation_provider_request_error
- Category: Quotation Construct Request Error
- Intent: `error_response_quotation_provider_request_error`
- Status: `ready`
- Trigger: I got error code 600099; QUOTATION_PROVIDER_REQUEST_ERROR
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-600015 - 600015 / quotation_provider_payment_success
- Category: Quotation Payment
- Intent: `error_response_quotation_provider_payment_success`
- Status: `ready`
- Trigger: I got error code 600015; QUOTATION_PROVIDER_PAYMENT_SUCCESS
- Agent action: No troubleshooting needed; proceed with the customer journey.
- Approved customer message:

Request Success

- Notes: ok to proceed

### ERR-RESPONSE-600014 - 600014 / quotation_provider_payment_hold_on
- Category: Quotation Payment
- Intent: `error_response_quotation_provider_payment_hold_on`
- Status: `ready`
- Trigger: I got error code 600014; QUOTATION_PROVIDER_PAYMENT_HOLD_ON
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-700001 - 700001 / member_password_confirm_password_mismatch
- Category: Member
- Intent: `error_response_member_password_confirm_password_mismatch`
- Status: `ready`
- Trigger: I got error code 700001; MEMBER_PASSWORD_CONFIRM_PASSWORD_MISMATCH
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-700002 - 700002 / member_identification_invalid
- Category: Member
- Intent: `error_response_member_identification_invalid`
- Status: `ready`
- Trigger: I got error code 700002; MEMBER_IDENTIFICATION_INVALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-700003 - 700003 / member_identification_exists
- Category: Member
- Intent: `error_response_member_identification_exists`
- Status: `ready`
- Trigger: I got error code 700003; MEMBER_IDENTIFICATION_EXISTS
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-700004 - 700004 / member_password_pattern_invalid
- Category: Member
- Intent: `error_response_member_password_pattern_invalid`
- Status: `ready`
- Trigger: I got error code 700004; MEMBER_PASSWORD_PATTERN_INVALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-700005 - 700005 / member_not_found
- Category: Member
- Intent: `error_response_member_not_found`
- Status: `ready`
- Trigger: I got error code 700005; MEMBER_NOT_FOUND
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-700006 - 700006 / member_pass_invalid
- Category: Member
- Intent: `error_response_member_pass_invalid`
- Status: `ready`
- Trigger: I got error code 700006; MEMBER_PASS_INVALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-710001 - 710001 / member_rs_temp_pass_invalid
- Category: Member Reset Password
- Intent: `error_response_member_rs_temp_pass_invalid`
- Status: `ready`
- Trigger: I got error code 710001; MEMBER_RS_TEMP_PASS_INVALID
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-720001 - 720001 / member_invalid_login
- Category: Member Login
- Intent: `error_response_member_invalid_login`
- Status: `ready`
- Trigger: I got error code 720001; MEMBER_INVALID_LOGIN
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again. If issue persist, kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-720002 - 720002 / member_account_not_verified
- Category: Member Login
- Intent: `error_response_member_account_not_verified`
- Status: `ready`
- Trigger: I got error code 720002; MEMBER_ACCOUNT_NOT_VERIFIED
- Agent action: Use the approved message and check the related transaction or service status.
- Approved customer message:

Some of the info entered  was invalid. Please check your details and try again

- Notes: ok to proceed

### ERR-RESPONSE-720003 - 720003 / member_invalid_status
- Category: Member Login
- Intent: `error_response_member_invalid_status`
- Status: `ready`
- Trigger: I got error code 720003; MEMBER_INVALID_STATUS
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-720004 - 720004 / member_account_locked
- Category: Member Login
- Intent: `error_response_member_account_locked`
- Status: `ready`
- Trigger: I got error code 720004; MEMBER_ACCOUNT_LOCKED
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Sorry, we're unable to process your request. Kindly reach out to customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-730001 - 730001 / member_contact_exits
- Category: Member Contact
- Intent: `error_response_member_contact_exits`
- Status: `ready`
- Trigger: I got error code 730001; MEMBER_CONTACT_EXITS
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Please verify your details and try again. If issue persist, kindly reach out to our customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-730002 - 730002 / member_contact_not_found
- Category: Member Contact
- Intent: `error_response_member_contact_not_found`
- Status: `ready`
- Trigger: I got error code 730002; MEMBER_CONTACT_NOT_FOUND
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Please verify your details and try again. If issue persist, kindly reach out to our customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-730003 - 730003 / member_contact_invalid
- Category: Member Contact
- Intent: `error_response_member_contact_invalid`
- Status: `ready`
- Trigger: I got error code 730003; MEMBER_CONTACT_INVALID
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Please verify your details and try again. If issue persist, kindly reach out to our customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-730004 - 730004 / member_contact_used
- Category: Member Contact
- Intent: `error_response_member_contact_used`
- Status: `ready`
- Trigger: I got error code 730004; MEMBER_CONTACT_USED
- Agent action: Apologize, share the code, and route to CoverMi customer support.
- Approved customer message:

Please verify your details and try again. If issue persist, kindly reach out to our customer support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800001 - 800001 / payment_retrieve_bank_error
- Category: Payment
- Intent: `error_response_payment_retrieve_bank_error`
- Status: `ready`
- Trigger: I got error code 800001; PAYMENT_RETRIEVE_BANK_ERROR
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800002 - 800002 / payment_initiate_payment_error
- Category: Payment
- Intent: `error_response_payment_initiate_payment_error`
- Status: `ready`
- Trigger: I got error code 800002; PAYMENT_INITIATE_PAYMENT_ERROR
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800003 - 800003 / payment_cancel_payment_error
- Category: Payment
- Intent: `error_response_payment_cancel_payment_error`
- Status: `ready`
- Trigger: I got error code 800003; PAYMENT_CANCEL_PAYMENT_ERROR
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800004 - 800004 / payment_status_inquiry_error
- Category: Payment
- Intent: `error_response_payment_status_inquiry_error`
- Status: `ready`
- Trigger: I got error code 800004; PAYMENT_STATUS_INQUIRY_ERROR
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800005 - 800005 / payment_auth_token_error
- Category: Payment
- Intent: `error_response_payment_auth_token_error`
- Status: `ready`
- Trigger: I got error code 800005; PAYMENT_AUTH_TOKEN_ERROR
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800006 - 800006 / payment_crypto_error
- Category: Payment
- Intent: `error_response_payment_crypto_error`
- Status: `ready`
- Trigger: I got error code 800006; PAYMENT_CRYPTO_ERROR
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800007 - 800007 / payment_quotation_not_found
- Category: Payment
- Intent: `error_response_payment_quotation_not_found`
- Status: `ready`
- Trigger: I got error code 800007; PAYMENT_QUOTATION_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800008 - 800008 / payment_quotation_result_not_found
- Category: Payment
- Intent: `error_response_payment_quotation_result_not_found`
- Status: `ready`
- Trigger: I got error code 800008; PAYMENT_QUOTATION_RESULT_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800009 - 800009 / payment_sub_state_not_matched
- Category: Payment
- Intent: `error_response_payment_sub_state_not_matched`
- Status: `ready`
- Trigger: I got error code 800009; PAYMENT_SUB_STATE_NOT_MATCHED
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800010 - 800010 / payment_payment_gateway_not_found
- Category: Payment
- Intent: `error_response_payment_payment_gateway_not_found`
- Status: `ready`
- Trigger: I got error code 800010; PAYMENT_PAYMENT_GATEWAY_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800011 - 800011 / payment_vehicle_not_found
- Category: Payment
- Intent: `error_response_payment_vehicle_not_found`
- Status: `ready`
- Trigger: I got error code 800011; PAYMENT_VEHICLE_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800012 - 800012 / payment_callback_verification_failed
- Category: Payment
- Intent: `error_response_payment_callback_verification_failed`
- Status: `ready`
- Trigger: I got error code 800012; PAYMENT_CALLBACK_VERIFICATION_FAILED
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800013 - 800013 / payment_invoice_required_info_not_found
- Category: Payment
- Intent: `error_response_payment_invoice_required_info_not_found`
- Status: `ready`
- Trigger: I got error code 800013; PAYMENT_INVOICE_REQUIRED_INFO_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800014 - 800014 / payment_invoice_send_email_error
- Category: Payment
- Intent: `error_response_payment_invoice_send_email_error`
- Status: `ready`
- Trigger: I got error code 800014; PAYMENT_INVOICE_SEND_EMAIL_ERROR
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800015 - 800015 / payment_payment_gateway_setting_not_found
- Category: Payment
- Intent: `error_response_payment_payment_gateway_setting_not_found`
- Status: `ready`
- Trigger: I got error code 800015; PAYMENT_PAYMENT_GATEWAY_SETTING_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed

### ERR-RESPONSE-800016 - 800016 / payment_quotation_had_completed
- Category: Payment
- Intent: `error_response_payment_quotation_had_completed`
- Status: `ready`
- Trigger: I got error code 800016; PAYMENT_QUOTATION_HAD_COMPLETED
- Agent action: No troubleshooting needed; proceed with the customer journey.
- Approved customer message:

Request Success

- Notes: ok to proceed

### ERR-RESPONSE-900001 - 900001 / transaction_not_found
- Category: Transaction
- Intent: `error_response_transaction_not_found`
- Status: `ready`
- Trigger: I got error code 900001; TRANSACTION_NOT_FOUND
- Agent action: Apologize, share the code, and route to IT support / internal investigation.
- Approved customer message:

Sorry, we're unable to process your request.

Kindly reach out to IT support team for further assistance [{code}].

- Notes: ok to proceed
