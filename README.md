# Dineout Tracking Lib

💉 Inject  
🧪 Experiment  
📊 Monitor  
🍪 GDPR (Soon by Gummi)
  
## Installing the library

```sql
npm install do-tracking
```

## Usage

Insert this at some location in your code where this will run once (i.e. root layout file or a root document)  

```sql
<DineoutTracking companyIdentifier={...} />
```

The **companyIdentifier** should be the companyId or slug set in **Dineout Partner**  

## Partner Setup

In Company settings → Analytics → Online tracking.   

Companies can set three values there: Google Analytics, Facebook Pixel Id, Google Tag manager. After these values have been set in Partner the DineoutTracking react component will initialise these accompanying scripts in the clients using the library. It should work with multiple Pixels or Tag managers.

## Tracking events

There is a global type function that can be imported and used to send events to all the trackers.   

***sendDineoutEvent(EventName, Payload)***

We have the following predefined events and they should map to suggested Meta Pixel & Google Analytics - [Read more on Pixel events](https://www.facebook.com/business/help/402791146561655?id=1205376682832142), [Read more on Google Analytics events](https://support.google.com/analytics/answer/9267735?hl=en)

| Event Name | Payload |
| --- | --- |
| AddPaymentInfo |  |
| AddToCart |  |
| AddToWishlist |  |
| CompleteRegistration |  |
| Contact |  |
| CustomizeProduct |  |
| Donate |  |
| FindLocation |  |
| InitiateCheckout |  |
| Lead |  |
| Purchase | { value: number; currency: string; } |
| Search |  |
| StartTrial | { value: number; currency: string; predicted_ltv: number; } |
| SubmitApplication |  |
| Subscribe | { value: number; currency: string; predicted_ltv: number; } |
| ViewContent |  |
| Custom | Record<string, any> |
