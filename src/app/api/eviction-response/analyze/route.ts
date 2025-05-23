import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase } from '@/lib/mock-database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const state = formData.get('state') as string;
    const additionalData = formData.get('additionalData') as string;

    if (!file || !state) {
      return NextResponse.json(
        { error: 'File and state are required' },
        { status: 400 }
      );
    }

    let parsedAdditionalData = {};
    try {
      if (additionalData && additionalData !== 'undefined') {
        parsedAdditionalData = JSON.parse(additionalData);
      }
    } catch (e) {
      console.warn('Failed to parse additional data:', e);
    }

    // Check if we're in local development mode
    const isLocal = process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID;

    if (isLocal) {
      console.log('[LOCAL MODE] Using mock database for eviction analysis');
      
      // Create a job in the mock database
      const jobId = mockDatabase.createJob(file, state, parsedAdditionalData);
      
      return NextResponse.json({
        success: true,
        jobId,
        message: 'Analysis job created successfully',
        polling: {
          statusUrl: `/api/eviction-response/status/${jobId}`,
          pollInterval: 2000 // Poll every 2 seconds
        }
      });
    }

    // TODO: Production mode - integrate with actual AWS Lambda
    // For now, fall back to immediate mock response for production
    const mockResult = {
      noticeType: 'Non-Payment of Rent',
      deadline: '2024-02-15',
      amountDue: '$1,250.00',
      propertyAddress: '123 Main Street, Apt 4B, Los Angeles, CA 90210',
      landlordName: 'ABC Property Management',
      violations: [
        'Notice period may be insufficient under CA Civil Code 1946',
        'Missing required tenant rights information',
        'Improper service method documented'
      ],
      defenses: [
        'Habitability issues affecting rental value',
        'Landlord failed to provide required notices',
        'Partial payment was accepted after notice period',
        'Retaliatory eviction (recent repair requests)',
        'Discrimination based on protected class'
      ],
      urgency: 'high',
      confidence: 0.87,
      responseText: `[Date]

ABC Property Management
[Landlord Address]

RE: Response to Three-Day Notice to Pay Rent or Quit
Property Address: 123 Main Street, Apt 4B, Los Angeles, CA 90210

Dear ABC Property Management,

I am writing in response to the Three-Day Notice to Pay Rent or Quit dated [Notice Date] regarding the above-referenced property.

FACTUAL DISPUTES:
I dispute the amount claimed as due. The notice states $1,250.00 is owed, however, I believe this amount is incorrect due to:
- Partial payment of $500.00 made on [Date] which was accepted by your office
- Rent reduction warranted due to ongoing habitability issues including [specific issues]

LEGAL DEFENSES:
1. HABITABILITY ISSUES: The premises has substantial habitability problems that affect the rental value, including but not limited to [specific conditions]. Under California Civil Code Section 1942.4, these conditions may justify rent withholding or reduction.

2. IMPROPER NOTICE: The notice may not comply with California Civil Code Section 1946 regarding proper notice requirements and tenant rights information.

3. RETALIATORY EVICTION: This eviction notice appears to be in retaliation for my recent requests for repairs, which is prohibited under California Civil Code Section 1942.5.

DEMAND FOR CURE:
I request that you:
1. Provide proper accounting of all payments and charges
2. Address the habitability issues immediately
3. Provide proper notice in compliance with state law

I am prepared to pay any amount properly owed once these issues are resolved. I request that you withdraw this notice and work with me to resolve these matters.

Please contact me at [Phone] to discuss resolution.

Sincerely,
[Tenant Name]
[Date]

---
CERTIFICATE OF SERVICE
I hereby certify that a true copy of the foregoing was served upon the landlord by:
[ ] Hand delivery
[ ] Certified mail, return receipt requested
[ ] Other: ________________

Date: _____________ Signature: _________________________`,
      courtInstructions: `FILING INSTRUCTIONS FOR LOS ANGELES COUNTY:

1. FILE YOUR RESPONSE: You must file your response with the court within 5 days of being served with an unlawful detainer lawsuit.

2. COURT LOCATION: 
   Los Angeles Superior Court - Central District
   111 N Hill St, Los Angeles, CA 90012
   Phone: (213) 830-0800

3. REQUIRED FORMS:
   - Answer to Unlawful Detainer (Form UD-105)
   - Filing fee: $435 (fee waiver available if you qualify)

4. SERVE LANDLORD: You must also serve a copy of your response on the landlord's attorney within the same timeframe.

5. LEGAL ASSISTANCE: Consider contacting legal aid organizations for free assistance with your case.

IMPORTANT: Missing the deadline to respond can result in a default judgment against you.`,
      legalAidContacts: [
        {
          name: "Legal Aid Foundation of Los Angeles",
          phone: "(800) 399-4529",
          website: "https://lafla.org",
          address: "1102 Crenshaw Blvd, Los Angeles, CA 90019"
        },
        {
          name: "Neighborhood Legal Services",
          phone: "(213) 896-5211",
          website: "https://nlsla.org",
          address: "1104 E Grand Ave, Los Angeles, CA 90021"
        }
      ],
      state: state,
      stateLaws: [
        'California Civil Code Section 1946 - Notice Requirements',
        'California Civil Code Section 1942.4 - Habitability',
        'California Civil Code Section 1942.5 - Retaliatory Eviction'
      ],
      deadlineType: 'Response to Notice',
      keyDates: [
        {
          date: '2024-02-15',
          description: 'Deadline to respond to eviction notice',
          type: 'deadline'
        },
        {
          date: '2024-02-20',
          description: 'Potential court filing date if not resolved',
          type: 'court'
        }
      ]
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('Eviction analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 