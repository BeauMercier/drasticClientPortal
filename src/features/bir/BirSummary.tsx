import { BirRow } from '@/lib/types/bir';
import { BirAnswersData } from '@/lib/validation/bir'; // Import specific answers type

// Helper to safely render answer values
function renderAnswer(value: any): React.ReactNode {
    if (value === null || typeof value === 'undefined' || value === '') {
        return <span className="text-muted-foreground italic">Not provided</span>;
    }
    if (Array.isArray(value)) {
        // Render array items (assuming URLs for social links)
        if (value.length === 0) {
            return <span className="text-muted-foreground italic">None</span>;
        }
        return (
            <ul className="list-disc list-inside">
                {value.map((item, index) => (
                    typeof item === 'string' && item.trim() !== '' ? 
                    <li key={index}><a href={item} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{item}</a></li> : null
                ))}
            </ul>
        );
    }
     if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
         return <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{value}</a>;
     }
    if (typeof value === 'object') {
        return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
    }
    // Render strings with line breaks preserved
    if (typeof value === 'string') {
        return <span className="whitespace-pre-wrap">{value}</span>;
    }
    return String(value);
}

// Type guard for better type checking of answers
function isValidAnswersObject(answers: any): answers is Partial<BirAnswersData> {
    return typeof answers === 'object' && answers !== null && !Array.isArray(answers);
}

interface BirSummaryProps {
    bir: BirRow | null | undefined;
}

/**
 * Read-only component to display submitted Business Information Request details.
 */
export default function BirSummary({ bir }: BirSummaryProps) {
    if (!bir) {
        return <p className="text-muted-foreground italic">No Business Information has been submitted for this project yet.</p>;
    }

    const answers = isValidAnswersObject(bir.answers) ? bir.answers : {};

    // Helper component for displaying each field
    const DetailItem = ({ label, value }: { label: string; value: any }) => (
        <div className="grid grid-cols-3 gap-2 py-2 border-b last:border-b-0">
            <div className="font-medium text-sm col-span-1">{label}:</div>
            <div className="text-sm col-span-2">{renderAnswer(value)}</div>
        </div>
    );

    return (
        <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
                 <h3 className="text-lg font-semibold">Business Information Summary</h3>
                 {/* TODO: Add status badge/indicator */} 
                 <span className='capitalize font-medium text-sm px-2 py-0.5 rounded bg-secondary text-secondary-foreground'>{bir.status ?? 'Unknown'}</span>
            </div>
            
            <div className="space-y-3">
                <DetailItem label="Official Company Name" value={answers.official_company_name} />
                <DetailItem label="Official Phone" value={answers.official_company_phone} />
                <DetailItem label="Official Email" value={answers.official_company_email} />
                <DetailItem label="Official Address" value={answers.official_company_address} />
                <DetailItem label="General Contact Email" value={answers.email} />
                <DetailItem label="Website URL" value={answers.website_url} />
                <DetailItem label="Facebook URL" value={answers.facebook_url} />
                <DetailItem label="Instagram URL" value={answers.instagram_url} />
                <DetailItem label="Other Social Links" value={answers.other_social_links} />
                <DetailItem label="Services Description" value={answers.services_description} />
                <DetailItem label="Company History/Mission" value={answers.company_history_mission} />
                <DetailItem label="Team Member Profiles" value={answers.team_member_profiles} />
                <DetailItem label="Certs/Testimonials/Cases" value={answers.certifications_testimonials_case_studies} />
                <DetailItem label="Partnerships/Affiliations" value={answers.partnerships_affiliations} />
                <DetailItem label="FAQs/Key Information" value={answers.faqs_key_information} />
                <DetailItem label="Specific Features/Requests" value={answers.specific_features_requests} />
                
                 {/* TODO: Display uploaded file information */} 
                 <div className="grid grid-cols-3 gap-2 py-2 border-b last:border-b-0">
                     <div className="font-medium text-sm col-span-1">Uploaded Files:</div>
                     <div className="text-sm col-span-2">
                         <span className="text-muted-foreground italic">File display not yet implemented.</span>
                         {/* Map through file references once available */}
                    </div>
                </div>
                
                <DetailItem label="Additional Comments" value={answers.additional_comments} />
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t mt-4">
                Submitted: {bir.submitted_at ? new Date(bir.submitted_at).toLocaleString() : 'N/A'} | 
                Last Updated: {bir.updated_at ? new Date(bir.updated_at).toLocaleString() : 'N/A'}
            </div>
        </div>
    );
} 