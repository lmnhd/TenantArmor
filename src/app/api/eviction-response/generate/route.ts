import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';

// TODO: Define these interfaces based on actual needs
interface EvictionResponseRequest {
  userId: string;
  state: 'CA' | 'NY' | 'TX';
  reason: 'non-payment' | 'lease-violation' | 'no-cause';
  formData: {
    tenantName: string;
    landlordName: string;
    noticeDate: string; // YYYY-MM-DD
    deadlineDate: string; // YYYY-MM-DD
    county: string;
    // Reason-specific fields:
    paymentDate?: string; // YYYY-MM-DD
    paymentMethod?: string;
    leaseEndDate?: string; // YYYY-MM-DD
    violationClaimed?: string;
    curePeriod?: string; // e.g., "3 days"
  };
}

interface EvictionResponseOutput {
  letterContent: string;
  courtInstructions: string;
  legalAidContacts: Array<{ name: string; phone?: string; url?: string; notes?: string }>;
}

interface MetaData {
  courtInstructions: string;
  legalAidContacts: Array<{ name: string; phone?: string; url?: string; notes?: string }>;
}

// Helper function to replace placeholders in a string
function populateTemplate(template: string, data: Record<string, string | undefined>): string {
  let populatedTemplate = template;
  for (const key in data) {
    if (data[key] !== undefined) {
      const placeholder = `\\\\[${key}\\\\]`; // Matches [key]
      populatedTemplate = populatedTemplate.replace(new RegExp(placeholder, 'g'), data[key]!);
    }
  }
  // Replace any remaining placeholders (if data not provided) with a generic marker or empty string
  populatedTemplate = populatedTemplate.replace(/\\[[\\w\\s]+\\]/g, '[Data Not Provided]');
  return populatedTemplate;
}


export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EvictionResponseRequest = await req.json();
    const { state, reason, formData, userId } = body;

    // Basic validation
    if (!state || !reason || !formData || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (userId !== clerkUserId) {
        // This check is simplistic. In a real app, you might have scenarios where
        // an admin generates something for a user, but for now, assume user matches.
        console.warn('Request userId ${userId} does not match Clerk userId ${clerkUserId}');
        // Depending on policy, you might restrict this or allow if the requesting user has specific roles.
        // For now, we'll proceed but it's a point to consider for security.
    }


    const templateFileName = 'response.txt'; // or response.md
    const metaFileName = 'meta.json';

    // Construct paths relative to the project root (TenantArmor_SASS/)
    // process.cwd() in Next.js API routes on Vercel points to the root of the deployment.
    // Locally, it's typically the project root.
    const baseDir = process.cwd(); 
    const templateFilePath = path.join(baseDir, 'documents', 'legal-templates-source', state, reason, templateFileName);
    const metaFilePath = path.join(baseDir, 'documents', 'legal-templates-source', state, reason, metaFileName);

    let letterTemplate: string;
    let metaData: MetaData;

    try {
      letterTemplate = await fs.readFile(templateFilePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading template file ${templateFilePath}:`, error);
      return NextResponse.json({ error: `Template for ${state}/${reason} not found.` }, { status: 404 });
    }

    try {
      const metaFileContent = await fs.readFile(metaFilePath, 'utf-8');
      metaData = JSON.parse(metaFileContent);
    } catch (error) {
        console.error(`Error reading or parsing meta file ${metaFilePath}:`, error);
      return NextResponse.json({ error: `Metadata for ${state}/${reason} not found or invalid.` }, { status: 404 });
    }

    // Populate letter content
    const populatedLetter = populateTemplate(letterTemplate, formData);

    // Populate court instructions (e.g., [County])
    const populatedCourtInstructions = populateTemplate(metaData.courtInstructions, formData);
    
    // Populate legal aid contacts if they have placeholders (might be rare, but good practice)
    const populatedLegalAidContacts = metaData.legalAidContacts.map(contact => ({
        ...contact,
        name: populateTemplate(contact.name, formData),
        notes: contact.notes ? populateTemplate(contact.notes, formData) : undefined,
    }));


    const responsePayload: EvictionResponseOutput = {
      letterContent: populatedLetter,
      courtInstructions: populatedCourtInstructions,
      legalAidContacts: populatedLegalAidContacts,
    };

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error) {
    console.error('Error in /api/eviction-response/generate:', error);
    // Type guard for error
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 